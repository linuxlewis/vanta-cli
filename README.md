# Vanta CLI

A TypeScript CLI for Vanta test workflows, built from the agent-first template style.

## Global Installation

```bash
npm install --global github:linuxlewis/vanta-cli
```

Confirm the executable is available:

```bash
vanta-cli --help
```

To update the global install later, rerun the install command:

```bash
npm install --global github:linuxlewis/vanta-cli
```

## Local Checkout Installation

Use this when you are developing the CLI from this repository:

```bash
pnpm install
pnpm build
npm install --global .
```

After changing the source, rebuild before using the global binary again:

```bash
pnpm build
```

## OAuth Authentication

Create a **Manage Vanta** application in Vanta's Developer Console, generate its OAuth client secret, then save the credentials in the same JSON format used by Vanta's MCP server:

```bash
mkdir -p ~/.config/vanta
chmod 700 ~/.config/vanta

cat > ~/.config/vanta/credentials.json <<'JSON'
{
  "client_id": "vci_YOUR_CLIENT_ID",
  "client_secret": "vcs_YOUR_CLIENT_SECRET"
}
JSON

chmod 600 ~/.config/vanta/credentials.json
```

The default credentials path is `~/.config/vanta/credentials.json`. You can override it with `--credentials-file`, `VANTA_ENV_FILE`, or `VANTA_CREDENTIALS_FILE`.

The CLI uses Vanta's OAuth client-credentials flow against `https://api.vanta.com/oauth/token`, then sends the returned access token as `Authorization: Bearer <token>` on API requests. Access tokens are cached at `~/.config/vanta/oauth-token-cache.json` until shortly before expiration so repeated agent calls do not request and revoke a new Vanta token each time.

You can still pass OAuth credentials per command or via environment variables:

```bash
vanta-cli \
  --client-id vci_YOUR_CLIENT_ID \
  --client-secret vcs_YOUR_CLIENT_SECRET \
  tests list
```

```bash
export VANTA_CLIENT_ID=vci_YOUR_CLIENT_ID
export VANTA_CLIENT_SECRET=vcs_YOUR_CLIENT_SECRET
export VANTA_OAUTH_SCOPE="vanta-api.all:read vanta-api.all:write"
```

## Commands

List tests:

```bash
vanta-cli tests list --status NEEDS_ATTENTION --category INFRASTRUCTURE
```

List failing entities for a test:

```bash
vanta-cli tests entities --test-id inventory-list-descriptions --status FAILING
```

Preview entity deactivation:

```bash
vanta-cli tests deactivate-entities \
  --test-id inventory-list-descriptions \
  --entity-id entity_123 \
  --reason "Accepted risk for legacy bucket" \
  --dry-run
```

Deactivate one or more entities:

```bash
vanta-cli tests deactivate-entities \
  --test-id inventory-list-descriptions \
  --entity-id entity_123 \
  --entity-id entity_456 \
  --reason "Accepted risk for legacy buckets" \
  --until 2026-12-31T00:00:00.000Z
```

## Vanta API Scope

The Vanta API deactivates individual test entities with `POST /v1/tests/{testId}/entities/{entityId}/deactivate`. Use the list commands first to find the test ID and failing entity IDs.

Relevant Vanta docs:

- [Authentication](https://developer.vanta.com/docs/api-access-setup)
- [Vanta MCP server](https://github.com/VantaInc/vanta-mcp-server)
- [List tests](https://developer.vanta.com/reference/listtests)
- [Get test entities by test ID](https://developer.vanta.com/reference/gettestentities)
- [Deactivate test entity](https://developer.vanta.com/reference/deactivatetestentity)
