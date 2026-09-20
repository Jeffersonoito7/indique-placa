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
npx vercel --prod    # deploy (GitHub HTTPS bloqueado — sempre usar este)
```
<!-- MANAGED-END: commands -->

## Hierarquia de perfis

`master → associacao → gestor → consultor → indicador → lead → venda → comissao`

Cada nível tem seu próprio painel em `app/<perfil>/` e cookie de sessão `<perfil>_auth`.

## Autenticação

- **HMAC-SHA256 customizado** via `lib/sessoes.ts` — não usa Supabase Auth
- Rotas `/api/master/*`: chamar `verificarToken(token)` de `lib/master-token.ts` (usa `MASTER_TOKEN_SECRET`)
- Rotas `/api/<perfil>/*` (demais): chamar `get<Perfil>Logado(req)` de `lib/auth.ts` no início do handler
- Middleware protege apenas páginas — rotas `/api/` **não** são protegidas automaticamente
- Master não usa banco; credenciais vêm de `MASTER_USUARIO` / `MASTER_SENHA` via env

## Supabase

- Usar sempre `supabaseAdmin` de `lib/supabase-server.ts` nas rotas de API (service_role)
- `supabaseAdmin` é `server-only` — nunca importar em componentes client
- Checks de existência (email, fone, etc.): usar `.maybeSingle()` — `.single()` engole erros de banco
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
- Fetches em `useEffect`: sempre checar `r.ok` antes de `r.json()`, adicionar `.catch(() => {})`
- `app/error.tsx`: sempre capturar `{ error, reset }` — descartar `error` cega o debugging

## Estrutura de pastas

| Pasta | Conteúdo |
|-------|---------|
| `app/api/<perfil>/` | Rotas protegidas por perfil |
| `app/api/publico/` | Rotas abertas (indicar, cadastros) |
| `app/api/cron/` | Jobs agendados via Vercel Cron |
| `app/api/<perfil>/upgrade/webhook/` | Webhooks PIX — validar txid E valor pago >= valor esperado |
| `lib/` | Utilitários server-only |
| `components/` | Componentes React reutilizáveis |
| `sql/` | Migrations SQL para executar no Supabase SQL Editor |

## Pendências de banco (executar no Supabase SQL Editor)

- `sql/fix_indicacoes_unique_placa.sql` — adiciona UNIQUE(consultor_id, placa) na tabela indicacoes

## Dívidas técnicas conhecidas (não introduzir mais)

- Sem RLS no Supabase — autorização feita 100% em código com service_role
- Credenciais de terceiros (EFI, Meta, OpenAI) em texto plano no banco
- Zero testes automatizados
