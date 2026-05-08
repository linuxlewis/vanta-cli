# ARCHITECTURE.md

## Layered CLI Architecture

The CLI mirrors the agent-first template's domain layout:

```text
Types -> Config -> Repo -> Service -> Runtime
```

| Layer | Purpose |
| --- | --- |
| `types/` | Vanta schemas, enums, and TypeScript types |
| `config/` | Environment and CLI option parsing |
| `repo/` | Vanta HTTP client and API response validation |
| `service/` | Deactivation workflows and dry-run behavior |
| `runtime/` | Commander commands and terminal output |

## Vanta Test Deactivation Model

Vanta's public API deactivates test entities, not whole tests. This CLI therefore supports:

1. Finding tests with `GET /v1/tests`.
2. Listing a test's entities with `GET /v1/tests/{testId}/entities`.
3. Deactivating selected entities with `POST /v1/tests/{testId}/entities/{entityId}/deactivate`.

## Vanta Control Evidence Model

Vanta uploads control evidence through document requests, not directly to controls. This CLI therefore supports:

1. Finding controls with `GET /v1/controls`.
2. Listing a control's document requests with `GET /v1/controls/{controlId}/documents`.
3. Uploading document or screenshot evidence with `POST /v1/documents/{documentId}/uploads`.
4. Optionally submitting the document collection with `POST /v1/documents/{documentId}/submit`.

## Boundary Rules

- OAuth client credentials are read from an MCP-style JSON file at `~/.config/vanta/credentials.json` by default.
- The credentials file format is `{ "client_id": "...", "client_secret": "..." }`.
- CLI options, `VANTA_CLIENT_ID`/`VANTA_CLIENT_SECRET`, and `VANTA_ENV_FILE` can override the default credentials file.
- OAuth access tokens are requested with the client-credentials grant and cached on disk until shortly before expiration.
- The API base URL defaults to `https://api.vanta.com`, with `--base-url` for testing or proxies.
- Network responses are validated before entering service logic.
- `--dry-run` must never perform deactivation requests.
- `--dry-run` must never upload or submit document evidence.
