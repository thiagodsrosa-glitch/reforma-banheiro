# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sistema de acompanhamento da **Reforma do Banheiro Masculino da Igreja Matriz**. Site com dois perfis de acesso (equipe/admin) e bot WhatsApp para captura automática de mensagens do grupo.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)

# Database
npm run db:generate      # Regenerate Prisma client (run after schema changes)
npm run db:push          # Push schema to DB without migration file
npm run db:migrate       # Create and apply migration
npm run db:seed          # Seed initial users and renovation stages
npm run db:studio        # Open Prisma Studio (visual DB browser)

# Build
npm run build            # Production build (also type-checks)
npm run lint             # ESLint

# WhatsApp bot (separate service)
cd whatsapp-bot && npm install && node index.js
```

## Architecture

**Next.js 16 (App Router) + Prisma 7 + PostgreSQL**

| Path | Purpose |
|------|---------|
| `src/app/login/` | Login page (public) |
| `src/app/dashboard/` | Admin-only area |
| `src/app/equipe/` | Team member area |
| `src/app/api/` | REST API routes |
| `src/proxy.ts` | Route protection (replaces middleware in Next.js 16) |
| `src/lib/auth.ts` | JWT sign/verify, session helpers |
| `src/lib/prisma.ts` | Prisma singleton with PrismaPg adapter |
| `src/generated/prisma/` | Auto-generated Prisma client (do not edit) |
| `whatsapp-bot/` | Standalone Node.js service (whatsapp-web.js) |

## Key Technical Decisions

**Prisma 7**: Uses `prisma-client` generator (not `prisma-client-js`). Imports from `@/generated/prisma/client`, not `@prisma/client`. The datasource URL is NOT in `schema.prisma` — it's passed via `PrismaPg` adapter in `src/lib/prisma.ts`.

**Auth**: Custom JWT auth with `jose`. No NextAuth. Session stored in HTTP-only cookie `session`. Two roles: `USER` (equipe) and `ADMIN` (presidente/admin).

**Next.js 16 Proxy**: Routing protection lives in `src/proxy.ts` (file convention changed from `middleware.ts` in Next.js 16). Export must be named `proxy`, not `middleware`.

**WhatsApp Bot**: Runs as a separate process/service (not inside Next.js). Connects to a WhatsApp group via `whatsapp-web.js`, saves messages via `POST /api/whatsapp` with `x-api-key` header. Must run on Railway (needs persistent process). Has auto-reconnect logic.

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=random-long-string
WHATSAPP_BOT_API_KEY=shared-secret-with-bot
```

## Database Setup (first time)

1. Create PostgreSQL database (Railway recommended)
2. Copy `.env.example` → `.env` and fill values
3. `npm run db:push` (creates tables)
4. `npm run db:seed` (creates admin + team users + 8 renovation stages)

Default credentials after seed:
- Admin: `admin@igrejamatriz.com` / `admin123`
- Equipe: `equipe@igrejamatriz.com` / `equipe123`

Change passwords after first login.
