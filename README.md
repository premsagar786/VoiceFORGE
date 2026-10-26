# VoiceForge

No-code voice AI agent builder — describe an agent in one sentence, talk to it live in the browser, refine it with natural language, deploy it as a web widget or shareable link. Built on ElevenLabs (ElevenAgents, TTS, Scribe STT). Works in English and Hindi.

> Hackathon MVP — docs below will be finalized in Step 12 (architecture diagram, screenshots, demo script).

## Quick start

Prerequisites: Node 20+, pnpm 10+, Docker Desktop.

```bash
pnpm install
cp .env.example .env        # then fill DATABASE_URL, SESSION_SECRET, ENCRYPTION_KEY
pnpm db:up                  # Postgres 16 + pgvector on localhost:5433
pnpm db:migrate             # Prisma migrate dev
pnpm db:seed                # demo user + dental agent + price-list PDF
pnpm dev                    # API on :4000, web on :3000
```

- Web: http://localhost:3000
- API health: http://localhost:4000/health
- Demo login: `demo@voiceforge.app` / `voiceforge-demo`

See `.env.example` for every key and where to get it. Secrets are read **only** in backend code.

## Stack

- **Monorepo** — pnpm workspaces: `apps/web` (Next.js App Router), `apps/api` (Fastify), `packages/shared` (Zod schemas).
- **DB** — PostgreSQL + pgvector via Prisma.
- **Voice** — ElevenLabs conversational AI (TTS + Scribe STT).
- **LLM** — OpenAI or Anthropic behind one adapter, chosen by `LLM_PROVIDER`.

## Repo layout

- `apps/web` — dashboard, agent editor, talk console, deploy, call logs, public widget page.
- `apps/api` — auth, agents, generation, voice sync, knowledge, tools, deploy, conversations, webhooks.
- `packages/shared` — `AgentConfig` Zod schema shared by frontend, backend and LLM prompts.
- `docs/decisions.md` — every "simplest option that satisfies the AC" call, recorded.
