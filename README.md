# Vanta CLI

A TypeScript CLI for Vanta test workflows, built from the agent-first template style.

## Setup

```bash
pnpm install
pnpm build
```

Set your Vanta API token:

```bash
export VANTA_API_TOKEN=vat_YOUR_TOKEN
```

## Commands

List tests:

```bash
pnpm dev tests list --status NEEDS_ATTENTION --category INFRASTRUCTURE
```

List failing entities for a test:

```bash
pnpm dev tests entities --test-id inventory-list-descriptions --status FAILING
```

Preview entity deactivation:

```bash
pnpm dev tests deactivate-entities \
  --test-id inventory-list-descriptions \
  --entity-id entity_123 \
  --reason "Accepted risk for legacy bucket" \
  --dry-run
```

Deactivate one or more entities:

```bash
pnpm dev tests deactivate-entities \
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
