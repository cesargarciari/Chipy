---
description: Run Chipy's definition-of-done gate and report failures
allowed-tools: Bash(pnpm:*), Bash(docker compose:*), Bash(git status:*), Bash(git diff:*)
---

Run the definition-of-done gate from `CLAUDE.md`. Report results only. Do not fix
anything unless I ask in a follow-up.

1. Check `git status` and `git diff --stat`. If `packages/engine` or `apps/web`
   changed in a way that touches the career loop or a UI flow, note that `pnpm e2e`
   should also run.
2. Make sure DynamoDB Local is up for the API tests:
   `docker compose up -d dynamodb-local`.
3. Run these in order. Stop at the first failure and show its output verbatim:
   - `pnpm format:check`
   - `pnpm lint`
   - `pnpm typecheck`
   - `DYNAMODB_ENDPOINT=http://localhost:8000 pnpm test`
   - `pnpm --filter @chipy/engine test:coverage` (only if the engine changed)
   - `pnpm e2e` (only if step 1 flagged it)
4. Summary: a checklist of what passed and what failed, plus the exact command to
   reproduce each failure. No em dashes.
