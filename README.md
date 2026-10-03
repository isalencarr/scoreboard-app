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

## Dados e permissões

| Tabela                | Leitura                  | Escrita                               |
| --------------------- | ------------------------ | ------------------------------------- |
| `games`               | pública                  | dono (RLS) ou control_token (RPC)     |
| `game_events`         | pública                  | dono (RLS) ou control_token (RPC)     |
| `game_control_tokens` | só o dono                | só por trigger na criação do jogo     |

`games.user_id` aponta para `auth.users`. `game_events` não tem `user_id`: a
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
