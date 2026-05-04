# Quality Notes

## Current Guarantees

- Vanta API responses are parsed with Zod at the HTTP boundary.
- Deactivation tests use mocked fetch calls and do not contact Vanta.
- `--dry-run` is covered by service tests and skips the POST request.

## Known Gaps

- No live integration test is included because deactivation is a destructive Vanta operation.
- Pagination is exposed through cursors, but there is no auto-pagination command yet.
