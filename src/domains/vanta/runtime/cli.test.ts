import { describe, expect, it, vi } from "vitest";
import { createVantaCli } from "./cli.js";

function createOutput() {
  let stdout = "";
  let stderr = "";
  return {
    writer: {
      write(message: string) {
        stdout += message;
      },
      error(message: string) {
        stderr += message;
      },
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

describe("createVantaCli", () => {
  it("wires test listing filters to the service", async () => {
    const output = createOutput();
    const service = {
      listTests: vi.fn(async () => ({ data: [{ id: "test_1" }] })),
      listTestEntities: vi.fn(),
      deactivateEntities: vi.fn(),
    };
    const cli = createVantaCli({ testService: service, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "tests",
      "list",
      "--status",
      "NEEDS_ATTENTION",
      "--category",
      "INFRASTRUCTURE",
    ]);

    expect(service.listTests).toHaveBeenCalledWith({
      statusFilter: "NEEDS_ATTENTION",
      categoryFilter: "INFRASTRUCTURE",
      frameworkFilter: undefined,
      integrationFilter: undefined,
      controlFilter: undefined,
      ownerFilter: undefined,
      isInRollout: undefined,
      pageSize: undefined,
      pageCursor: undefined,
    });
    expect(JSON.parse(output.stdout)).toEqual({ data: [{ id: "test_1" }] });
  });

  it("wires entity deactivation with dry-run options", async () => {
    const output = createOutput();
    const service = {
      listTests: vi.fn(),
      listTestEntities: vi.fn(),
      deactivateEntities: vi.fn(async () => [
        {
          testId: "test_1",
          entityId: "entity_1",
          action: "would_deactivate" as const,
        },
      ]),
    };
    const cli = createVantaCli({ testService: service, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "tests",
      "deactivate-entities",
      "--test-id",
      "test_1",
      "--entity-id",
      "entity_1",
      "--entity-id",
      "entity_2",
      "--reason",
      "Accepted risk",
      "--dry-run",
    ]);

    expect(service.deactivateEntities).toHaveBeenCalledWith({
      testId: "test_1",
      entityIds: ["entity_1", "entity_2"],
      reason: "Accepted risk",
      until: undefined,
      dryRun: true,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: [
        {
          testId: "test_1",
          entityId: "entity_1",
          action: "would_deactivate",
        },
      ],
    });
  });

  it("wires control listing with framework filters", async () => {
    const output = createOutput();
    const controlService = {
      listControls: vi.fn(async () => ({
        data: [{ id: "lcckzq29", externalId: "AST-78" }],
      })),
      setOwner: vi.fn(),
    };
    const cli = createVantaCli({ controlService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "controls",
      "list",
      "--framework",
      "nist53",
      "--page-size",
      "100",
    ]);

    expect(controlService.listControls).toHaveBeenCalledWith({
      frameworkMatchesAny: ["nist53"],
      pageSize: 100,
      pageCursor: undefined,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: [{ id: "lcckzq29", externalId: "AST-78" }],
    });
  });

  it("wires control set-owner with dry-run", async () => {
    const output = createOutput();
    const controlService = {
      listControls: vi.fn(),
      setOwner: vi.fn(async () => ({
        controlId: "AST-78",
        userId: "user_1",
        action: "would_set" as const,
      })),
    };
    const cli = createVantaCli({ controlService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "controls",
      "set-owner",
      "--control-id",
      "AST-78",
      "--user-id",
      "user_1",
      "--dry-run",
    ]);

    expect(controlService.setOwner).toHaveBeenCalledWith({
      controlId: "AST-78",
      userId: "user_1",
      dryRun: true,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: {
        controlId: "AST-78",
        userId: "user_1",
        action: "would_set",
      },
    });
  });

  it("wires document listing with filters", async () => {
    const output = createOutput();
    const documentService = {
      listDocuments: vi.fn(async () => ({
        data: [{ id: "access-requests", overallStatus: "Needs document" }],
      })),
      listControlDocuments: vi.fn(),
      uploadDocumentEvidence: vi.fn(),
      uploadControlEvidence: vi.fn(),
    };
    const cli = createVantaCli({ documentService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "documents",
      "list",
      "--framework",
      "soc2",
      "--status",
      "Needs document",
      "--page-size",
      "100",
    ]);

    expect(documentService.listDocuments).toHaveBeenCalledWith({
      frameworkMatchesAny: ["soc2"],
      statusMatchesAny: ["Needs document"],
      pageSize: 100,
      pageCursor: undefined,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: [{ id: "access-requests", overallStatus: "Needs document" }],
    });
  });

  it("wires control document listing", async () => {
    const output = createOutput();
    const documentService = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(async () => ({
        data: [{ id: "access-requests" }],
      })),
      uploadDocumentEvidence: vi.fn(),
      uploadControlEvidence: vi.fn(),
    };
    const cli = createVantaCli({ documentService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "controls",
      "documents",
      "--control-id",
      "AST-78",
    ]);

    expect(documentService.listControlDocuments).toHaveBeenCalledWith({
      controlId: "AST-78",
      pageSize: undefined,
      pageCursor: undefined,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: [{ id: "access-requests" }],
    });
  });

  it("wires document upload with dry-run and submit", async () => {
    const output = createOutput();
    const documentService = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentEvidence: vi.fn(async () => ({
        documentId: "access-requests",
        filePath: "/tmp/access-review.png",
        fileName: "access-review.png",
        mimeType: "image/png",
        action: "would_upload" as const,
        submitAction: "would_submit" as const,
      })),
      uploadControlEvidence: vi.fn(),
    };
    const cli = createVantaCli({ documentService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "documents",
      "upload",
      "--document-id",
      "access-requests",
      "--file",
      "/tmp/access-review.png",
      "--description",
      "Quarterly access review",
      "--effective-at",
      "2026-05-06T00:00:00.000Z",
      "--submit",
      "--dry-run",
    ]);

    expect(documentService.uploadDocumentEvidence).toHaveBeenCalledWith({
      documentId: "access-requests",
      filePath: "/tmp/access-review.png",
      description: "Quarterly access review",
      effectiveAtDate: "2026-05-06T00:00:00.000Z",
      fileName: undefined,
      mimeType: undefined,
      submit: true,
      dryRun: true,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: {
        documentId: "access-requests",
        filePath: "/tmp/access-review.png",
        fileName: "access-review.png",
        mimeType: "image/png",
        action: "would_upload",
        submitAction: "would_submit",
      },
    });
  });

  it("wires control evidence upload", async () => {
    const output = createOutput();
    const documentService = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentEvidence: vi.fn(),
      uploadControlEvidence: vi.fn(async () => ({
        documentId: "access-requests",
        filePath: "/tmp/access-review.png",
        fileName: "access-review.png",
        mimeType: "image/png",
        action: "uploaded" as const,
        submitAction: "skipped" as const,
      })),
    };
    const cli = createVantaCli({ documentService, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "controls",
      "upload-evidence",
      "--control-id",
      "AST-78",
      "--document-id",
      "access-requests",
      "--file",
      "/tmp/access-review.png",
      "--skip-control-document-check",
    ]);

    expect(documentService.uploadControlEvidence).toHaveBeenCalledWith({
      controlId: "AST-78",
      documentId: "access-requests",
      filePath: "/tmp/access-review.png",
      description: undefined,
      effectiveAtDate: undefined,
      fileName: undefined,
      mimeType: undefined,
      submit: undefined,
      dryRun: undefined,
      skipControlDocumentCheck: true,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: {
        documentId: "access-requests",
        filePath: "/tmp/access-review.png",
        fileName: "access-review.png",
        mimeType: "image/png",
        action: "uploaded",
        submitAction: "skipped",
      },
    });
  });
});
