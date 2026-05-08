import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  ListControlDocumentsParams,
  ListDocumentsParams,
  UploadDocumentFileInput,
  VantaApiClient,
} from "../repo/vanta-api-client.js";
import type {
  PageInfo,
  UploadDocumentFileResponse,
  VantaDocument,
} from "../types/schemas.js";

export type UploadDocumentEvidenceInput = {
  documentId: string;
  filePath: string;
  description?: string;
  effectiveAtDate?: string;
  fileName?: string;
  mimeType?: string;
  submit?: boolean;
  dryRun?: boolean;
};

export type UploadControlEvidenceInput = UploadDocumentEvidenceInput & {
  controlId: string;
  skipControlDocumentCheck?: boolean;
};

export type UploadEvidenceResult = {
  documentId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  action: "uploaded" | "would_upload";
  submitAction: "submitted" | "would_submit" | "skipped";
  upload?: UploadDocumentFileResponse;
};

export type VantaDocumentService = {
  listDocuments(params: ListDocumentsParams): Promise<{
    data: VantaDocument[];
    pageInfo?: PageInfo;
  }>;
  listControlDocuments(params: ListControlDocumentsParams): Promise<{
    data: VantaDocument[];
    pageInfo?: PageInfo;
  }>;
  uploadDocumentEvidence(
    input: UploadDocumentEvidenceInput,
  ): Promise<UploadEvidenceResult>;
  uploadControlEvidence(
    input: UploadControlEvidenceInput,
  ): Promise<UploadEvidenceResult>;
};

export type VantaDocumentApi = Pick<
  VantaApiClient,
  | "listDocuments"
  | "listControlDocuments"
  | "uploadDocumentFile"
  | "submitDocument"
>;

export function createVantaDocumentService(
  client: VantaDocumentApi,
): VantaDocumentService {
  return {
    async listDocuments(params) {
      const response = await client.listDocuments(params);
      return {
        data: response.results.data,
        pageInfo: response.results.pageInfo,
      };
    },

    async listControlDocuments(params) {
      const response = await client.listControlDocuments(params);
      return {
        data: response.results.data,
        pageInfo: response.results.pageInfo,
      };
    },

    async uploadDocumentEvidence(input) {
      return uploadDocumentEvidence(client, input);
    },

    async uploadControlEvidence(input) {
      if (!input.skipControlDocumentCheck) {
        const response = await client.listControlDocuments({
          controlId: input.controlId,
          pageSize: 100,
        });
        const documentIds = response.results.data.map(
          (document) => document.id,
        );
        if (!documentIds.includes(input.documentId)) {
          throw new Error(
            `Document ${input.documentId} is not attached to control ${input.controlId}. Available document IDs: ${documentIds.join(
              ", ",
            )}`,
          );
        }
      }

      return uploadDocumentEvidence(client, input);
    },
  };
}

async function uploadDocumentEvidence(
  client: Pick<VantaDocumentApi, "uploadDocumentFile" | "submitDocument">,
  input: UploadDocumentEvidenceInput,
): Promise<UploadEvidenceResult> {
  const prepared = await prepareUpload(input);

  if (input.dryRun) {
    return {
      documentId: input.documentId,
      filePath: prepared.filePath,
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      action: "would_upload",
      submitAction: input.submit ? "would_submit" : "skipped",
    };
  }

  const upload = await client.uploadDocumentFile(
    input.documentId,
    prepared.upload,
  );

  if (input.submit) {
    await client.submitDocument(input.documentId);
  }

  return {
    documentId: input.documentId,
    filePath: prepared.filePath,
    fileName: prepared.fileName,
    mimeType: upload.mimeType ?? prepared.mimeType,
    action: "uploaded",
    submitAction: input.submit ? "submitted" : "skipped",
    upload,
  };
}

async function prepareUpload(input: UploadDocumentEvidenceInput): Promise<{
  filePath: string;
  fileName: string;
  mimeType: string;
  upload: UploadDocumentFileInput;
}> {
  const filePath = path.resolve(input.filePath);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`Evidence path is not a file: ${filePath}`);
  }

  const fileName = input.fileName ?? path.basename(filePath);
  const mimeType = input.mimeType ?? inferMimeType(fileName);
  const file = new Blob([await readFile(filePath)], { type: mimeType });

  return {
    filePath,
    fileName,
    mimeType,
    upload: {
      file,
      fileName,
      ...(input.effectiveAtDate
        ? { effectiveAtDate: input.effectiveAtDate }
        : {}),
      ...(input.description ? { description: input.description } : {}),
    },
  };
}

export function inferMimeType(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case ".csv":
      return "text/csv";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".json":
      return "application/json";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".txt":
      return "text/plain";
    case ".webp":
      return "image/webp";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}
