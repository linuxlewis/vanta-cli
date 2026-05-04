# Installation

## Production Global Install

Install the public GitHub repository as a global CLI:

```bash
npm install --global github:linuxlewis/vanta-cli
```

Verify that the binary is on `PATH`:

```bash
vanta-cli --help
```

This is the recommended setup when other local agents should be able to call the CLI by name.

## Agent Environment

The CLI uses Vanta OAuth client credentials. Create a **Manage Vanta** application in the Vanta Developer Console and store the credentials in the same JSON format used by Vanta's MCP server:

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

Any shell or agent that can read `~/.config/vanta/credentials.json` can run:

```bash
vanta-cli tests list
```

To use a different credentials file, set the Vanta MCP-compatible variable or pass a CLI option:

```bash
export VANTA_ENV_FILE=/absolute/path/to/credentials.json
vanta-cli --credentials-file /absolute/path/to/credentials.json tests list
```

The JSON file may also include an optional `scope` field. Otherwise, the CLI defaults to `vanta-api.all:read vanta-api.all:write`.

You can still use environment variables for ephemeral setups:

```bash
export VANTA_CLIENT_ID=vci_YOUR_CLIENT_ID
export VANTA_CLIENT_SECRET=vcs_YOUR_CLIENT_SECRET
export VANTA_OAUTH_SCOPE="vanta-api.all:read vanta-api.all:write"
```

The CLI requests an OAuth access token with `grant_type: client_credentials` and caches it at `~/.config/vanta/oauth-token-cache.json`. Override the cache path when agents need a shared or isolated cache:

```bash
export VANTA_TOKEN_CACHE_PATH=/secure/shared/path/vanta-oauth-token.json
```

Vanta currently allows only one active access token per OAuth application. Sharing the same cache between agents that use the same `client_id` avoids unnecessary token revocation between CLI invocations.

## Local Development Install

From a local checkout:

```bash
pnpm install
pnpm build
npm install --global .
```

After source changes, rerun:

```bash
pnpm build
```

The global binary points to the package's built `dist/cli.js` entrypoint.

## Uninstall

```bash
npm uninstall --global vanta-cli
```
