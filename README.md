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

## Rotas

| Rota                       | Acesso          | Descrição                      |
| -------------------------- | --------------- | ------------------------------ |
| `/`                        | público         | Início e jogos recentes        |
| `/login`                   | público         | Envio do link de acesso        |
| `/auth/callback`           | público         | Retorno do link mágico         |
| `/scoreboard/new`          | requer login    | Criação de jogo                |
| `/scoreboard/:id`          | público         | Placar para transmissão        |
| `/scoreboard/:id/control`  | token na URL    | Painel do operador             |
| `/history`                 | público         | Jogos finalizados              |

## Scripts

- `bun run dev` — servidor de desenvolvimento
- `bun run build` — build de produção
- `bun run lint` — ESLint
- `bun run preview` — serve o build
