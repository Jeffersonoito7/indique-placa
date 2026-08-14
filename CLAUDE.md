@AGENTS.md

# IndiquePlaca — CLAUDE.md

SaaS multi-tenant de indicação de clientes para proteção veicular.
Stack: Next.js 14 App Router + Supabase + Vercel.

<!-- MANAGED-START: commands -->
## Comandos

```bash
npm run dev          # dev com Turbopack (NODE_OPTIONS="--max-old-space-size=2048" se travar)
npm run build        # build de produção
npm run lint         # ESLint
npx tsc --noEmit     # typecheck
npx vercel --prod    # deploy manual (obrigatório após force push)
```
<!-- MANAGED-END: commands -->

## Hierarquia de perfis

`master → associacao → gestor → consultor → indicador → lead → venda → comissao`

Cada nível tem seu próprio painel em `app/<perfil>/` e cookie de sessão `<perfil>_auth`.

## Autenticação

- **HMAC-SHA256 customizado** via `lib/sessoes.ts` — não usa Supabase Auth
- Sessões validadas por `validarSessao(token, tipo)` em cada rota protegida
- Funções de conveniência em `lib/auth.ts`: `getConsultorLogado()`, `getGestorLogado()`, etc.
- **Master** usa variáveis de ambiente fixas (`MASTER_USUARIO` / `MASTER_SENHA`), sem banco
- Middleware só protege páginas (`/gestor/**`, `/consultor/**`, etc.), **não** as rotas `/api/`
- Toda rota `/api/` deve chamar `get<Perfil>Logado()` manualmente no início do handler

## Supabase

- Usar sempre `supabaseAdmin` de `lib/supabase-server.ts` nas rotas de API (service_role)
- `supabaseAdmin` é `server-only` — nunca importar em componentes client
- `supabase.ts` é o client público (anon key) para uso no browser
- Checks de existência (email, fone, etc.): usar `.maybeSingle()` + tratar o campo `error`
- `.single()` só quando "não encontrado" é erro real (ex: buscar o próprio perfil autenticado)
- DDL (CREATE TABLE, ALTER, etc.) não funciona via service_role — usar SQL Editor do Supabase

## Rate limit

```ts
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
const { allowed } = await rateLimit(getRateLimitKey(req, "prefixo"), 5, 15 * 60 * 1000);
```

Nunca ler `x-forwarded-for` diretamente — `getRateLimitKey` já trata corretamente.

## Convenções de código

- Alias `@/` para a raiz do projeto
- Componentes server por padrão; adicionar `"use client"` apenas quando necessário
- Handlers de evento (`onClick`, `onMouseEnter`, etc.) exigem `"use client"` — sem exceção
- Validação de entrada com Zod em todas as rotas públicas
- Erros retornados como `{ error: "mensagem" }` com status HTTP correto
- Sem comentários explicando o quê — só o porquê quando não óbvio

## Estrutura de pastas

| Pasta | Conteúdo |
|-------|---------|
| `app/api/<perfil>/` | Rotas protegidas por perfil |
| `app/api/publico/` | Rotas abertas (indicar, cadastros) |
| `app/api/cron/` | Jobs agendados via Vercel Cron |
| `app/api/<perfil>/upgrade/webhook/` | Webhooks PIX — validar txid E valor |
| `lib/` | Utilitários server-only |
| `components/` | Componentes React reutilizáveis |
| `sql/` | Migrations SQL para executar no Supabase |

## Dívidas técnicas conhecidas (não introduzir mais)

- Sem RLS no Supabase — autorização feita 100% em código com service_role
- Credenciais de terceiros (EFI, Meta, OpenAI) em texto plano no banco
- Webhook PIX não valida valor — ativa plano com qualquer pagamento no txid correto
- Race condition no POST de cobrança PIX (sem UNIQUE constraint no banco)
- Zero testes automatizados

## Deploy

1. Commitar e fazer push para `main`
2. Vercel faz deploy automático em resposta ao push
3. Após `git push --force`, o Vercel **não** dispara deploy — rodar `npx vercel --prod`
