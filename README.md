# Scoreboard

Placar esportivo em tempo real: crie um jogo, controle o placar pelo celular e
transmita a tela pública para o público.

React + Vite + Supabase (Postgres, Realtime e Auth).

## Configuração

```bash
bun install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
bun run dev
```

Aplique as migrações de `supabase/migrations/` no projeto Supabase (via
`supabase db push` ou colando o SQL no editor do painel).

### Login por e-mail (link mágico)

O login é sem senha: o usuário informa o e-mail e recebe um link de acesso.

No painel do Supabase, em **Authentication > URL Configuration**:

- **Site URL**: a URL de produção (ex.: `https://seu-app.netlify.app`)
- **Redirect URLs**: adicione `http://localhost:5173/auth/callback` e
  `https://seu-app.netlify.app/auth/callback`

O remetente padrão do Supabase tem limite de poucos e-mails por hora — para uso
real, configure SMTP próprio em **Authentication > Emails > SMTP Settings**.

A tela de login também aceita um código de 6 dígitos como alternativa ao link.
Para que o código apareça no e-mail, inclua `{{ .Token }}` no template de
**Magic Link** em **Authentication > Emails**.

## Placar: cores e regras

**Cores dos times.** Cada jogo guarda `home_team_color` e `away_team_color`
(hex `#rrggbb`). A cor do texto não é configurável: o placar calcula a
luminância relativa da cor do time pela WCAG 2.1 e escolhe preto ou branco,
o que der mais contraste — então nenhuma combinação sai ilegível. Se a cor
escolhida for quase igual ao fundo do placar, a faixa recebe um contorno
sutil. As cores são definidas ao criar o jogo e podem mudar durante a
partida pelo painel de controle; o placar público acompanha em tempo real.

**Períodos e prorrogação.** O indicador mostra `Q1`..`Q4` na regulamentação
e `OT1`, `OT2`, … nas prorrogações, calculado como
`period - total_periods`.

**Bônus (situação de penalização).** Seguindo a FIBA, a partir da 5ª falta
coletiva no período o time entra em bônus e o placar exibe o selo `BÔNUS`
ao lado da contagem de faltas desse time. As faltas coletivas zeram a cada
troca de quarto, mas **não** zeram ao entrar na prorrogação nem entre
prorrogações, porque cada OT é extensão do 4º quarto para efeito de faltas
coletivas.

O limite fica em `bonus_foul_limit` (padrão 5) e é editável na criação do
jogo. Use 4 se preferir que o indicador avise um lance antes, quando o time
ainda está a uma falta de ser penalizado.

Voltar um período pelo controle não restaura a contagem anterior de faltas
— ela não é armazenada por período, então quem opera ajusta à mão.

## Dados e permissões

| Tabela                | Leitura                  | Escrita                               |
| --------------------- | ------------------------ | ------------------------------------- |
| `games`               | pública                  | dono (RLS) ou control_token (RPC)     |
| `game_events`         | pública                  | dono (RLS) ou control_token (RPC)     |
| `game_control_tokens` | só o dono                | só por trigger na criação do jogo     |

`games.user_id` aponta para `auth.users`. As colunas de aparência e regra
(`home_team_color`, `away_team_color`, `bonus_foul_limit`) também passam pela
lista fechada de `update_game_with_token`, então o operador pode ajustá-las
com o token, mas não consegue tocar em `user_id` nem no placar final. `game_events` não tem `user_id`: a
posse vem de `games` através de `game_id`.

Quem opera o placar não precisa de conta — o segredo é o `control_token` na
URL de controle. Ele é validado no banco pelas funções `update_game_with_token`,
`add_game_event_with_token` e `finish_game_with_token`, que também aceitam o
dono autenticado. Por isso o token mora em `game_control_tokens`, fora da
tabela de leitura pública: antes ele vinha junto com o placar em toda consulta.

Jogos criados antes do multi-usuário ficam com `user_id` nulo — seguem
controláveis por quem tem o token, mas não aparecem em "Meus jogos".

## Rotas

| Rota                      | Acesso                 | Descrição                           |
| ------------------------- | ---------------------- | ----------------------------------- |
| `/`                       | público                | Página inicial                      |
| `/login`                  | público                | Envio do link de acesso             |
| `/auth/callback`          | público                | Retorno do link mágico              |
| `/admin`                  | requer login           | Meus jogos, com filtro por status   |
| `/admin/games/:id`        | requer login (dono)    | Placar ao vivo, atalhos e histórico |
| `/history`                | requer login           | Meus jogos finalizados              |
| `/scoreboard/new`         | requer login           | Criação de jogo                     |
| `/scoreboard/:id`         | público                | Placar para transmissão             |
| `/scoreboard/:id/control` | token na URL, ou dono  | Painel do operador                  |

Depois do login o usuário cai em `/admin`. A página de um jogo reúne o que o
dono precisa: placar atualizado em tempo real, link e QR code do controle,
link do placar público e o log de eventos agrupado por dia.

O operador do placar não precisa de conta — basta o link de controle, que o
dono copia ou compartilha por QR code em `/admin/games/:id`.

## Scripts

- `bun run dev` — servidor de desenvolvimento
- `bun run build` — build de produção
- `bun run lint` — ESLint
- `bun run preview` — serve o build
