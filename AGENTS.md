## Approach

- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Skip files over 100KB unless explicitly required.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

## Non-negotiables

- You are FORBIDDEN from deleting any files yourself.
- If a file must be retired by you: keep an empty `_deprecated_*.ts(x)` replacement with a short comment.
- The user MAY delete files. If a file is already deleted (shows as `deleted` in git status), do NOT restore it — include the deletion as-is in the commit.
- Never edit `.env`, `.env.local`, or any `.env*` file.
- If env vars change, update `.env.example` only.
- Never run production database migrations (`bun run --filter @workspace/db migrate:prod`).
- Only run development migrations (`bun run --filter @workspace/db migrate:dev`); production migration execution is user-managed.
- Code identifiers, comments, filenames, schemas: English only.
- User-facing UI copy: English only. Professional, clear, and concise — match the tone of serious developer tools (e.g., Vercel, Linear, Stripe). No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated wording.
- Never use the em dash character (`—`) in user-facing text. Use a comma, colon, or period instead.
- All `unstable_cache` usage must include `cacheTags` from `@/server/cache/cache-tags`.

## Code comments

- Comments exist to capture **decisions**, not describe code. A dev returning in 6 months should understand _why_ the code is this way, not _what_ it does.
- Comment when: choosing one approach over an obvious alternative, working around a limitation, relying on non-obvious behavior, or enforcing a subtle business rule.
- Never comment what the code plainly says (e.g. no `// get user` above `getUser()`).
- Prefer a short inline `// why` over a multi-line block above a function.

## Critical conventions

All coding standards live in the `coding-standards` skill at `.agents/skills/coding-standards/`. Read it before writing code, reviewing changes, or answering questions about conventions. Most of them are enforced by `bun run lint`.

- Use canonical domain terms defined in `CONTEXT.md`.

## Required checks before done

- Run from repo root: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run format:check`.
- Every lint rule is at `error` with zero warnings tolerated, so any report is a regression.
- On a fresh clone, generate before you lint: `bun run build:packages`, `bun run --filter @workspace/db db:gen`, then `bunx --cwd apps/web next typegen`.
- If DB schema changed: run `bun run --filter @workspace/db migrate:dev`, then `bun run --filter @workspace/db db:gen`.
- Never declare completion while required checks fail.

## Package manager

- Bun. Use `bun install`, `bun run <script>`, `bun run --filter <pkg> <script>`, `bunx`. Never npm/pnpm/yarn.
- `bunfig.toml` pins `linker = "hoisted"` — turbo and Next.js resolve platform binaries from a hoisted tree.

## Keep costs low

- Reuse existing patterns in touched folders.
- Keep edits scoped to the task.
- Prefer enforceable rules in lint/CI/hooks over prompt text.

## Next.js

`apps/web` runs a Next.js version with breaking changes against your training data. Before writing Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/` (see `apps/web/AGENTS.md`).

## Project docs

- Glossary at `CONTEXT.md`; ADRs in `docs/adr/`; system notes in `docs/systems/`.

## This fork

- Fork of `manucoffin/faster-fixes` (git remote `upstream`). Sync by merging `upstream/main`; keep upstream's folder layout so merges stay mechanical.
- Self-hosted only: no marketing pages, no billing, no transactional email, no tracking. `isCloud()` is always false here; cloud-only branches are dead code.
- Integrations: GitHub and Linear only. Jira and Slack are not part of this fork.
- Sign-up is invite-only. Accounts come from invitation links copied out of the UI (`/invite/[invitationId]`). The first account becomes admin.
- Storage is the `local` provider on a persistent volume, served through `/api/storage`.
- Deployed via Coolify from prebuilt GHCR images; `docker-compose.yaml` is the source of truth for runtime env.
