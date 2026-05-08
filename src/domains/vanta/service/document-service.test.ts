import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createVantaDocumentService,
  inferMimeType,
} from "./document-service.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "vanta-cli-"));
});

afterEach(async () => {
  await rm(tempDir, { force: true, recursive: true });
});

describe("createVantaDocumentService", () => {
  it("returns a dry-run result without uploading or submitting", async () => {
    const filePath = path.join(tempDir, "access-review.png");
    await writeFile(filePath, "screenshot");
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentFile: vi.fn(),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await expect(
      service.uploadDocumentEvidence({
        documentId: "access-requests",
        filePath,
        description: "Quarterly access review",
        submit: true,
        dryRun: true,
      }),
    ).resolves.toEqual({
      documentId: "access-requests",
      filePath,
      fileName: "access-review.png",
      mimeType: "image/png",
      action: "would_upload",
      submitAction: "would_submit",
    });
    expect(client.uploadDocumentFile).not.toHaveBeenCalled();
    expect(client.submitDocument).not.toHaveBeenCalled();
  });

  it("uploads and submits document evidence", async () => {
    const filePath = path.join(tempDir, "access-review.pdf");
    await writeFile(filePath, "document");
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentFile: vi.fn(async () => ({
        id: "upload_1",
        fileName: "access-review.pdf",
        mimeType: "application/pdf",
      })),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    const result = await service.uploadDocumentEvidence({
      documentId: "access-requests",
      filePath,
      effectiveAtDate: "2026-05-06T00:00:00.000Z",
      submit: true,
    });

    expect(client.uploadDocumentFile).toHaveBeenCalledWith(
      "access-requests",
      expect.objectContaining({
        fileName: "access-review.pdf",
        effectiveAtDate: "2026-05-06T00:00:00.000Z",
      }),
    );
    expect(client.submitDocument).toHaveBeenCalledWith("access-requests");
    expect(result).toMatchObject({
      documentId: "access-requests",
      fileName: "access-review.pdf",
      mimeType: "application/pdf",
      action: "uploaded",
      submitAction: "submitted",
      upload: { id: "upload_1" },
    });
  });

  it("checks that control evidence is uploaded to a document on that control", async () => {
    const filePath = path.join(tempDir, "access-review.png");
    await writeFile(filePath, "screenshot");
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(async () => ({
        results: { data: [{ id: "access-requests" }] },
      })),
      uploadDocumentFile: vi.fn(async () => ({
        id: "upload_1",
        fileName: "access-review.png",
        mimeType: "image/png",
      })),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await service.uploadControlEvidence({
      controlId: "AST-78",
      documentId: "access-requests",
      filePath,
    });

    expect(client.listControlDocuments).toHaveBeenCalledWith({
      controlId: "AST-78",
      pageSize: 100,
    });
    expect(client.uploadDocumentFile).toHaveBeenCalled();
  });

  it("rejects control evidence when the document is not attached to the control", async () => {
    const filePath = path.join(tempDir, "access-review.png");
    await writeFile(filePath, "screenshot");
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(async () => ({
        results: { data: [{ id: "other-document" }] },
      })),
      uploadDocumentFile: vi.fn(),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await expect(
      service.uploadControlEvidence({
        controlId: "AST-78",
        documentId: "access-requests",
        filePath,
      }),
    ).rejects.toThrow(
      "Document access-requests is not attached to control AST-78",
    );
    expect(client.uploadDocumentFile).not.toHaveBeenCalled();
  });

  it("can skip the control/document membership check", async () => {
    const filePath = path.join(tempDir, "access-review.png");
    await writeFile(filePath, "screenshot");
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentFile: vi.fn(async () => ({
        id: "upload_1",
        fileName: "access-review.png",
        mimeType: "image/png",
      })),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await service.uploadControlEvidence({
      controlId: "AST-78",
      documentId: "access-requests",
      filePath,
      skipControlDocumentCheck: true,
    });

    expect(client.listControlDocuments).not.toHaveBeenCalled();
    expect(client.uploadDocumentFile).toHaveBeenCalled();
  });

  it("rejects missing local files", async () => {
    const client = {
      listDocuments: vi.fn(),
      listControlDocuments: vi.fn(),
      uploadDocumentFile: vi.fn(),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await expect(
      service.uploadDocumentEvidence({
        documentId: "access-requests",
        filePath: path.join(tempDir, "missing.png"),
      }),
    ).rejects.toThrow();
    expect(client.uploadDocumentFile).not.toHaveBeenCalled();
  });

  it("unwraps document list envelopes", async () => {
    const client = {
      listDocuments: vi.fn(async () => ({
        results: {
          pageInfo: { hasNextPage: false, endCursor: "cursor" },
          data: [{ id: "access-requests" }],
        },
      })),
      listControlDocuments: vi.fn(),
      uploadDocumentFile: vi.fn(),
      submitDocument: vi.fn(),
    };
    const service = createVantaDocumentService(client);

    await expect(service.listDocuments({ pageSize: 50 })).resolves.toEqual({
      data: [{ id: "access-requests" }],
      pageInfo: { hasNextPage: false, endCursor: "cursor" },
    });
  });
});

describe("inferMimeType", () => {
  it("detects common screenshot and document MIME types", () => {
    expect(inferMimeType("screenshot.png")).toBe("image/png");
    expect(inferMimeType("document.pdf")).toBe("application/pdf");
    expect(inferMimeType("unknown.bin")).toBe("application/octet-stream");
  });
});
