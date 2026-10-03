-- Multi-usuário: cada jogo passa a ter um dono (auth.users).
--
-- Leitura do placar segue pública (o placar existe para ser transmitido).
-- Escrita tem dois caminhos:
--   1. o dono autenticado, via RLS;
--   2. o operador com o control_token na URL, via funções SECURITY DEFINER.
--
-- Antes desta migração as policies de escrita eram `USING (true)` e o
-- control_token só era conferido no cliente — qualquer um podia alterar
-- qualquer jogo. Agora o token é validado no banco.

-- 1. Coluna de dono ------------------------------------------------------

ALTER TABLE games
  ADD COLUMN user_id uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN games.user_id IS
  'Dono do jogo. Nulo nos jogos criados antes do multi-usuário: esses '
  'seguem controláveis apenas por quem tem o control_token.';

CREATE INDEX games_user_id_created_at_idx
  ON games(user_id, created_at DESC);

CREATE INDEX games_user_id_status_idx
  ON games(user_id, status, finished_at DESC);

-- game_events não recebe user_id: a posse é derivada de games.user_id
-- através de game_id, evitando duplicar (e dessincronizar) o dono.

-- 2. O control_token sai de games ---------------------------------------
--
-- `games` tem leitura pública e é replicada pelo Realtime, então qualquer
-- visitante recebia o control_token junto com o placar. Como o token passa
-- a valer como credencial de escrita, ele vai para uma tabela própria,
-- legível só pelo dono.

CREATE TABLE game_control_tokens (
  game_id uuid PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX game_control_tokens_token_idx
  ON game_control_tokens(token);

INSERT INTO game_control_tokens (game_id, token, created_at)
  SELECT id, control_token, created_at FROM games;

DROP INDEX IF EXISTS games_control_token_idx;
ALTER TABLE games DROP COLUMN control_token;

-- Todo jogo novo ganha seu token automaticamente.
CREATE OR REPLACE FUNCTION create_game_control_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO game_control_tokens (game_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER games_create_control_token
  AFTER INSERT ON games
  FOR EACH ROW
  EXECUTE FUNCTION create_game_control_token();

ALTER TABLE game_control_tokens ENABLE ROW LEVEL SECURITY;

-- anon não recebe privilégio algum nesta tabela; authenticated só lê, e a
-- policy abaixo restringe as linhas aos jogos do próprio usuário.
REVOKE ALL ON TABLE game_control_tokens FROM anon, authenticated;
GRANT SELECT ON TABLE game_control_tokens TO authenticated;

-- Sem policy para anon: o token nunca sai pela API de leitura.
CREATE POLICY "game_control_tokens_owner_read"
  ON game_control_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_control_tokens.game_id
        AND games.user_id = auth.uid()
    )
  );

-- 3. Policies de games ---------------------------------------------------

DROP POLICY IF EXISTS "games_public_insert" ON games;
DROP POLICY IF EXISTS "games_public_update" ON games;

-- Leitura pública mantida ("games_public_read" continua valendo).

CREATE POLICY "games_owner_insert"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "games_owner_update"
  ON games FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "games_owner_delete"
  ON games FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Policies de game_events --------------------------------------------

DROP POLICY IF EXISTS "game_events_public_insert" ON game_events;

-- Leitura pública mantida ("game_events_public_read" continua valendo).

CREATE POLICY "game_events_owner_insert"
  ON game_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_events.game_id
        AND games.user_id = auth.uid()
    )
  );

-- 5. Escrita por control_token ------------------------------------------
--
-- O operador do placar não precisa de conta: o segredo é o token na URL.
-- As funções abaixo rodam como SECURITY DEFINER (ignorando RLS) e validam
-- o token — ou a posse, quando o dono está logado — antes de escrever.

CREATE OR REPLACE FUNCTION can_control_game(p_game_id uuid, p_control_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM games g
    LEFT JOIN game_control_tokens t ON t.game_id = g.id
    WHERE g.id = p_game_id
      AND (
        (p_control_token IS NOT NULL AND t.token = p_control_token)
        OR (g.user_id IS NOT NULL AND g.user_id = auth.uid())
      )
  );
$$;

COMMENT ON FUNCTION can_control_game IS
  'Verdadeiro quando o chamador apresenta o control_token correto ou é o dono do jogo.';

-- Atualiza apenas as colunas de operação do placar. user_id, placar final e
-- timestamps ficam fora da lista de propósito.
CREATE OR REPLACE FUNCTION update_game_with_token(
  p_game_id uuid,
  p_control_token uuid,
  p_updates jsonb
)
RETURNS games
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game games;
BEGIN
  IF NOT can_control_game(p_game_id, p_control_token) THEN
    RAISE EXCEPTION 'Sem permissão para controlar este jogo'
      USING errcode = '42501';
  END IF;

  UPDATE games SET
    home_team_name = COALESCE(p_updates->>'home_team_name', home_team_name),
    away_team_name = COALESCE(p_updates->>'away_team_name', away_team_name),
    home_score     = COALESCE((p_updates->>'home_score')::integer, home_score),
    away_score     = COALESCE((p_updates->>'away_score')::integer, away_score),
    home_fouls     = COALESCE((p_updates->>'home_fouls')::integer, home_fouls),
    away_fouls     = COALESCE((p_updates->>'away_fouls')::integer, away_fouls),
    period         = COALESCE((p_updates->>'period')::integer, period),
    is_overtime    = COALESCE((p_updates->>'is_overtime')::boolean, is_overtime),
    clock_running  = COALESCE((p_updates->>'clock_running')::boolean, clock_running),
    clock_seconds  = COALESCE((p_updates->>'clock_seconds')::integer, clock_seconds),
    clock_updated_at = COALESCE(
      (p_updates->>'clock_updated_at')::timestamptz,
      clock_updated_at
    ),
    status         = COALESCE((p_updates->>'status')::game_status, status)
  WHERE id = p_game_id
  RETURNING * INTO v_game;

  RETURN v_game;
END;
$$;

CREATE OR REPLACE FUNCTION add_game_event_with_token(
  p_game_id uuid,
  p_control_token uuid,
  p_type game_event_type,
  p_team team_side DEFAULT NULL,
  p_value integer DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS game_events
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event game_events;
BEGIN
  IF NOT can_control_game(p_game_id, p_control_token) THEN
    RAISE EXCEPTION 'Sem permissão para registrar eventos neste jogo'
      USING errcode = '42501';
  END IF;

  INSERT INTO game_events (game_id, type, team, value, payload)
  VALUES (p_game_id, p_type, p_team, p_value, COALESCE(p_payload, '{}'::jsonb))
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION finish_game_with_token(
  p_game_id uuid,
  p_control_token uuid
)
RETURNS games
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game games;
BEGIN
  IF NOT can_control_game(p_game_id, p_control_token) THEN
    RAISE EXCEPTION 'Sem permissão para finalizar este jogo'
      USING errcode = '42501';
  END IF;

  UPDATE games SET
    status = 'finished',
    clock_running = false,
    final_home_score = home_score,
    final_away_score = away_score,
    finished_at = now()
  WHERE id = p_game_id
  RETURNING * INTO v_game;

  INSERT INTO game_events (game_id, type, payload)
  VALUES (
    p_game_id,
    'game_finished',
    jsonb_build_object(
      'final_home_score', v_game.final_home_score,
      'final_away_score', v_game.final_away_score
    )
  );

  RETURN v_game;
END;
$$;

-- O operador pode não ter conta, então anon também executa.
--
-- can_control_game não é exposta: só roda dentro das funções acima, que são
-- SECURITY DEFINER e portanto a executam como dono. O REVOKE precisa citar
-- anon e authenticated explicitamente: o Supabase concede EXECUTE a esses
-- papéis por default privileges, e revogar de PUBLIC não desfaz isso —
-- caso contrário sobra um oráculo anônimo para testar control_tokens.
REVOKE ALL ON FUNCTION can_control_game(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION update_game_with_token(uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION add_game_event_with_token(uuid, uuid, game_event_type, team_side, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION finish_game_with_token(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION update_game_with_token(uuid, uuid, jsonb)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_game_event_with_token(uuid, uuid, game_event_type, team_side, integer, jsonb)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION finish_game_with_token(uuid, uuid)
  TO anon, authenticated;
