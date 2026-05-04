# AGENTS.md

This repository follows the agent-first template conventions, trimmed for a TypeScript CLI instead of a full web/API stack.

## Quick Navigation

| What | Where |
| --- | --- |
| Architecture and dependency rules | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Test commands and validation | [docs/testing.md](./docs/testing.md) |
| Known quality notes | [docs/quality.md](./docs/quality.md) |
| Documentation index | [docs/catalog.md](./docs/catalog.md) |

## Stack

pnpm · TypeScript · Commander · Zod · Vitest · Biome

## Key Rules

1. Keep domain code layered: Types -> Config -> Repo -> Service -> Runtime.
2. Parse all external data at the boundary with Zod.
3. Do not call the Vanta API from tests. Mock the fetch boundary in `repo/`.
4. Keep CLI rendering in `runtime/`; business decisions belong in `service/`.
5. Prefer JSON output for automation-friendly commands.

## Done Criteria

Run `pnpm lint`, `pnpm test`, and `pnpm build` after behavior changes.
