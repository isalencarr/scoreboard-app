-- Cor por time, escolhida por quem cria o jogo e ajustável no controle.
--
-- O placar deriva a cor do texto da luminância da cor do time (WCAG), então
-- só a cor de fundo é armazenada.

-- 1. Colunas de cor ------------------------------------------------------
--
-- Os defaults reproduzem o placar atual (casa vermelha, visitante escuro),
-- então jogos já existentes não mudam de aparência.

ALTER TABLE games
  ADD COLUMN home_team_color text NOT NULL DEFAULT '#dc2626',
  ADD COLUMN away_team_color text NOT NULL DEFAULT '#18181b';

-- Só hex de 6 dígitos: o cliente normaliza antes de enviar, e a constraint
-- impede que algo fora do formato chegue ao placar.
ALTER TABLE games
  ADD CONSTRAINT games_home_team_color_hex
    CHECK (home_team_color ~* '^#[0-9a-f]{6}$'),
  ADD CONSTRAINT games_away_team_color_hex
    CHECK (away_team_color ~* '^#[0-9a-f]{6}$');

COMMENT ON COLUMN games.home_team_color IS
  'Cor de fundo da faixa do time da casa, hex #rrggbb. '
  'A cor do texto é calculada no cliente por contraste.';
COMMENT ON COLUMN games.away_team_color IS
  'Cor de fundo da faixa do time visitante, hex #rrggbb.';

-- 2. Libera as cores na RPC de controle ----------------------------------
--
-- update_game_with_token trabalha com uma lista fechada de colunas, então
-- as novas precisam ser adicionadas explicitamente — caso contrário o
-- operador não consegue trocar a cor durante o jogo.

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
    home_team_color = COALESCE(p_updates->>'home_team_color', home_team_color),
    away_team_color = COALESCE(p_updates->>'away_team_color', away_team_color),
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

-- CREATE OR REPLACE preserva os grants, mas reafirmamos para deixar
-- explícito quem executa o quê.
REVOKE ALL ON FUNCTION update_game_with_token(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_game_with_token(uuid, uuid, jsonb)
  TO anon, authenticated;
