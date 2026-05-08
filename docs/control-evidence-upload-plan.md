# Control Evidence Upload Implementation Plan

## Objective

Enable `vanta-cli` commands that let an operator upload document evidence, including screenshots, for Vanta controls.

## Verified Vanta API Shape

Vanta does not expose a direct "upload file to control" endpoint in the public docs. The supported workflow is document-centered:

1. Discover controls with `GET /v1/controls`.
2. Discover document requests attached to a control with `GET /v1/controls/{controlId}/documents`.
3. Upload a file to a document request with `POST /v1/documents/{documentId}/uploads`.
4. Optionally submit the document collection with `POST /v1/documents/{documentId}/submit`.

Relevant docs:

- List controls: https://developer.vanta.com/reference/listcontrols
- List a control's documents: https://developer.vanta.com/reference/listdocumentsforcontrol
- List documents: https://developer.vanta.com/reference/listdocuments
- Upload file for document: https://developer.vanta.com/reference/uploadfilefordocument
- Submit document collection: https://developer.vanta.com/reference/submitdocumentcollection
- Upload workflow guide: https://developer.vanta.com/docs/upload-a-document

The upload request is `multipart/form-data` and requires `file`. It also accepts optional `effectiveAtDate` and `description`. Vanta returns `201` for uploaded files and `204` for submit.

## Command Design

Add document-oriented commands and a control convenience command:

```bash
vanta-cli documents list \
  --framework soc2 \
  --status "Needs document" \
  --page-size 100

vanta-cli controls documents \
  --control-id AST-78 \
  --page-size 100

vanta-cli documents upload \
  --document-id access-requests \
  --file ./evidence/access-review.png \
  --description "Quarterly access review screenshot" \
  --effective-at 2026-05-06T00:00:00.000Z \
  --submit

vanta-cli controls upload-evidence \
  --control-id AST-78 \
  --document-id access-requests \
  --file ./evidence/access-review.png \
  --description "Quarterly access review screenshot" \
  --submit
```

`documents upload` is the primitive and should work whenever the caller already knows the document ID. `controls upload-evidence` is a convenience wrapper that validates the document belongs to the control unless `--skip-control-document-check` is passed. Do not auto-pick a document when a control has multiple document requests; return JSON describing the candidates and require `--document-id`.

All commands should emit JSON. Upload success should include the document ID, file path, uploaded file ID, file name, MIME type when returned by Vanta, URL when returned by Vanta, and whether submit was called.

## Layered Implementation

### Types

Update `src/domains/vanta/types/schemas.ts`:

- Add `VantaDocumentSchema` and `ListDocumentsResponseSchema`.
- Add `UploadDocumentFileResponseSchema`.
- Add `DocumentStatusSchema` for known statuses: `Needs document`, `Needs update`, `Not relevant`, `OK`.
- Keep document response schemas `.passthrough()` because Vanta may add metadata fields.

### Repo

Update `src/domains/vanta/repo/vanta-api-client.ts`:

- Add `ListDocumentsParams` with `pageSize`, `pageCursor`, `frameworkMatchesAny`, and `statusMatchesAny`.
- Add `listDocuments(params)`.
- Add `listControlDocuments({ controlId, pageSize, pageCursor })`.
- Add `uploadDocumentFile(documentId, input)` using `FormData`.
- Add `submitDocument(documentId)`.

For multipart uploads, avoid setting `Content-Type` manually. Let `fetch` generate the boundary. Keep `Accept` and `Authorization` headers. Start with a buffered implementation using Node's standard `fs/promises.readFile`, `Blob`, and `FormData` to avoid adding a dependency; revisit streaming only if evidence files are expected to be large.

### Service

Add `src/domains/vanta/service/document-service.ts`:

- Unwrap Vanta list envelopes into `{ data, pageInfo }`.
- Validate local file existence and reject directories before creating multipart input.
- Provide dry-run behavior for uploads and submits.
- Implement `uploadDocumentEvidence`:
  - Resolve and validate the local path.
  - Infer filename from the path unless `--filename` is provided.
  - Infer MIME type from extension for common evidence types, with `--mime-type` override.
  - Upload the file unless `dryRun`.
  - Submit only when `--submit` is set and not `dryRun`.
- Implement `uploadControlEvidence`:
  - List documents for the control.
  - Confirm requested `documentId` is attached to the control.
  - Delegate to `uploadDocumentEvidence`.

Evidence screenshots do not need a distinct API path; they are files uploaded to document requests. The CLI should support screenshot formats through MIME inference and docs examples.

### Runtime

Update `src/domains/vanta/runtime/cli.ts`:

- Add a `documentService` dependency injection point for tests.
- Add `documents list`.
- Add `controls documents`.
- Add `documents upload`.
- Add `controls upload-evidence`.
- Parse repeatable `--framework` and `--status` filters with the existing `collect` helper.
- Parse upload flags: `--file`, `--description`, `--effective-at`, `--filename`, `--mime-type`, `--submit`, `--dry-run`, and `--skip-control-document-check`.

Keep terminal rendering in `runtime/` limited to JSON serialization.

## Test Plan

Add focused Vitest coverage without contacting Vanta:

- Schema tests for list documents, control documents, and upload response parsing.
- Repo tests for:
  - repeated `frameworkMatchesAny` and `statusMatchesAny` query params;
  - `GET /v1/controls/{controlId}/documents`;
  - multipart upload request path, method, auth header, and form fields;
  - `POST /v1/documents/{documentId}/submit`;
  - `201` JSON upload response and `204` submit response handling.
- Service tests for:
  - dry-run upload skipping API calls;
  - dry-run submit skipping submit;
  - control/document membership validation;
  - multiple control documents requiring explicit `documentId`;
  - missing local file error.
- Runtime tests for command wiring and JSON output.

After behavior changes, run:

```bash
pnpm lint
pnpm test
pnpm build
```

## Rollout Steps

1. Keep the existing controls support already started in this branch.
2. Add document schemas and repo methods.
3. Add document service behavior and file handling.
4. Add runtime commands.
5. Update README examples and `ARCHITECTURE.md` to describe the document-centered upload model.
6. Run the done-criteria commands.
7. Manually smoke test with `--dry-run` against a local fixture file.

## Open Decisions

- Whether to implement streaming multipart uploads after the buffered MVP.
- Whether `controls upload-evidence` should support a future `--title` selector if Vanta document IDs are hard to discover in day-to-day use.
- Whether submit should default to false, as planned here, or true for fully automated workflows. Defaulting false is safer because submit changes evidence state.
