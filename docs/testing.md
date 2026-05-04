# Testing

## Commands

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
node dist/cli.js --help
```

## Coverage Intent

- `types/` tests validate Vanta response schemas.
- `config/` tests validate token and base URL parsing.
- `repo/` tests mock `fetch` and assert OAuth token requests plus Vanta endpoint paths, methods, query parameters, and payloads.
- `service/` tests cover dry-run and batch entity deactivation behavior.
- `runtime/` tests cover CLI command wiring without calling the real Vanta API.
