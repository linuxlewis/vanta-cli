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

## Authentication

Set your Vanta API token in the environment used by your shell and agents:

```bash
export VANTA_API_TOKEN=vat_YOUR_TOKEN
```

For a persistent setup, add that export to your shell profile or agent environment bootstrap. The CLI sends the token as `Authorization: Bearer <token>` on Vanta API requests.

You can also pass the token per command:

```bash
vanta-cli --token vat_YOUR_TOKEN tests list
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

- [List tests](https://developer.vanta.com/reference/listtests)
- [Get test entities by test ID](https://developer.vanta.com/reference/gettestentities)
- [Deactivate test entity](https://developer.vanta.com/reference/deactivatetestentity)
