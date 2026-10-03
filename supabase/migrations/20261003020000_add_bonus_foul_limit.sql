-- Estado de "bônus" (situação de penalização) por período.
--
-- Regra FIBA: a partir da 5ª falta coletiva em um quarto, toda falta
-- seguinte do time dá dois lances livres ao adversário. Cada prorrogação
-- conta como extensão do 4º quarto, então as faltas coletivas NÃO zeram ao
-- entrar no OT nem entre prorrogações.
--
-- O limite fica configurável porque outras competições usam números
-- diferentes; 5 é o padrão FIBA.

ALTER TABLE games
  ADD COLUMN bonus_foul_limit integer NOT NULL DEFAULT 5;

ALTER TABLE games
  ADD CONSTRAINT games_bonus_foul_limit_positivo
    CHECK (bonus_foul_limit >= 1);

COMMENT ON COLUMN games.bonus_foul_limit IS
  'Faltas coletivas no período a partir das quais o time entra em bônus. '
  'FIBA = 5 (a 5ª falta já é penalizada). Use 4 para o indicador avisar '
  'um lance antes, quando o time ainda está a uma falta do limite.';

-- Libera a coluna na RPC de controle, que atualiza uma lista fechada.
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
    bonus_foul_limit = COALESCE(
      (p_updates->>'bonus_foul_limit')::integer,
      bonus_foul_limit
    ),
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

REVOKE ALL ON FUNCTION update_game_with_token(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_game_with_token(uuid, uuid, jsonb)
  TO anon, authenticated;
