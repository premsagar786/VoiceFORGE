# Decisions log

Simplest option that satisfies the acceptance criterion; one entry per decision. PRD (`Voice_AI_Agent_Builder_PRD.md`) was not available, so the build prompt is the single source of truth.

## 1. No PRD on disk — build prompt wins

The PRD file was not found in the workspace or on the machine (checked Desktop, Downloads, user folders). Per user confirmation, we proceed with the build prompt alone. Consequences:

- The `AgentConfig` schema is reconstructed from build-prompt feature spec #2 (fields: name, persona, goals, conversation flow, first message, guardrails do/don't, languages, voice, tools, escalation rule, max call length).
- PRD Section 8 (data model), Section 10 (schema), Section 17.1 (demo script) and the AC-1…AC-19 list are reconstructed from the build order / testing sections. If the PRD surfaces later, reconcile here first.

## 2. Tiered env validation

`env.ts` fails boot only when core vars are missing: `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY` (plus `APP_URL`/`API_URL`/`NEXT_PUBLIC_API_URL` in production). Voice, LLM, calendar and demo vars are validated-if-present; a missing key logs a loud boot warning, exposes `features.*` booleans, and the affected endpoints return a readable 503. Rationale: calendar is explicitly optional per the prompt; failing hard on voice keys would make local dev impossible before keys arrive.

## 3. Postgres 16 + pgvector via Docker Compose

Image `pgvector/pgvector:pg16` (per https://github.com/pgvector/pgvector), host port 5433 to avoid clashing with a local Postgres. The init migration runs `CREATE EXTENSION IF NOT EXISTS vector;` before the table DDL.

## 4. `@voiceforge/shared` ships raw TypeScript

`exports: "./src/index.ts"`. Next.js consumes it via `transpilePackages`; the API runs under `tsx`; Vitest resolves it through an alias. Avoids a separate build/watch loop for the shared package in a hackathon repo.

## 5. Embedding dimension fixed at 1536

`KnowledgeChunk.embedding` is `Unsupported("vector(1536)")?` — matches OpenAI `text-embedding-3-small` (default `EMBEDDING_MODEL`). Switching to a model with a different dimension requires a migration. Embedding vectors are written/read via raw SQL (`$executeRaw` / `$queryRaw`) because Prisma `Unsupported` fields are not client-writable.

## 6. bcryptjs instead of bcrypt

Pure JS, no node-gyp native build on Windows. Same API for hashing/checking.

## 7. Sessions: signed httpOnly cookie, no Redis

`@fastify/cookie` with `SESSION_SECRET`. In-memory rate limiter likewise. Fine for a hackathon; both have a clear upgrade path noted in the README.

## 8. Demo price-list PDF is generated at seed time

`src/lib/demo-pdf.ts` emits a small, valid, uncompressed PDF (Helvetica, plain text) into `UPLOAD_DIR`. Avoids committing a binary asset and gives Step 7's `pdf-parse` ingestion a real file to process.

## 9. Nested git repo

The enclosing `Desktop` folder is itself a git repo (an unrelated "meetflow" project). VoiceForge gets its own `git init` inside `projects/voice` so histories stay separate; nothing outside this folder is touched.

## 10. Framework pins

Next.js 15 / React 19 / Tailwind 4 / Fastify 5 / Prisma 6 / zod 3.x — known-stable, mutually compatible majors. ElevenLabs model/voice IDs and SDK method names will be verified against current docs (rule 7) in Steps 3 and 5, and noted here.
