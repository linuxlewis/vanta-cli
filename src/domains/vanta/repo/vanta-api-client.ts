import { z } from "zod";
import type { VantaConfig } from "../config/config.js";
import {
  type DeactivateTestEntityRequest,
  DeactivateTestEntityRequestSchema,
  type DocumentStatus,
  type EntityStatus,
  type ListControlsResponse,
  ListControlsResponseSchema,
  type ListDocumentsResponse,
  ListDocumentsResponseSchema,
  type ListTestEntitiesResponse,
  ListTestEntitiesResponseSchema,
  type ListTestsResponse,
  ListTestsResponseSchema,
  type SetControlOwnerRequest,
  SetControlOwnerRequestSchema,
  type TestCategory,
  type TestStatus,
  type UploadDocumentFileResponse,
  UploadDocumentFileResponseSchema,
} from "../types/schemas.js";
import type { AccessTokenProvider } from "./oauth-token-provider.js";

export type FetchFn = typeof fetch;

export type ListTestsParams = {
  pageSize?: number;
  pageCursor?: string;
  statusFilter?: TestStatus;
  frameworkFilter?: string;
  integrationFilter?: string;
  controlFilter?: string;
  ownerFilter?: string;
  categoryFilter?: TestCategory;
  isInRollout?: boolean;
};

export type ListTestEntitiesParams = {
  testId: string;
  entityStatus?: EntityStatus;
  pageSize?: number;
  pageCursor?: string;
};

export type ListControlsParams = {
  pageSize?: number;
  pageCursor?: string;
  frameworkMatchesAny?: string[];
};

export type ListDocumentsParams = {
  pageSize?: number;
  pageCursor?: string;
  frameworkMatchesAny?: string[];
  statusMatchesAny?: DocumentStatus[];
};

export type ListControlDocumentsParams = {
  controlId: string;
  pageSize?: number;
  pageCursor?: string;
};

export type UploadDocumentFileInput = {
  file: Blob;
  fileName: string;
  effectiveAtDate?: string;
  description?: string;
};

export class VantaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "VantaApiError";
  }
}

export class VantaApiClient {
  private readonly baseUrl: URL;
  private readonly fetchFn: FetchFn;
  private readonly accessTokenProvider: AccessTokenProvider;

  constructor(
    config: Pick<VantaConfig, "baseUrl">,
    accessTokenProvider: AccessTokenProvider,
    fetchFn: FetchFn = fetch,
  ) {
    this.baseUrl = new URL(config.baseUrl);
    this.fetchFn = fetchFn;
    this.accessTokenProvider = accessTokenProvider;
  }

  async listTests(params: ListTestsParams = {}): Promise<ListTestsResponse> {
    const url = this.url("/v1/tests", params);
    return this.request(url, ListTestsResponseSchema);
  }

  async listTestEntities(
    params: ListTestEntitiesParams,
  ): Promise<ListTestEntitiesResponse> {
    const { testId, ...query } = params;
    const url = this.url(
      `/v1/tests/${encodeURIComponent(testId)}/entities`,
      query,
    );
    return this.request(url, ListTestEntitiesResponseSchema);
  }

  async deactivateTestEntity(
    testId: string,
    entityId: string,
    body: DeactivateTestEntityRequest,
  ): Promise<void> {
    const parsedBody = DeactivateTestEntityRequestSchema.parse(body);
    const url = this.url(
      `/v1/tests/${encodeURIComponent(testId)}/entities/${encodeURIComponent(
        entityId,
      )}/deactivate`,
    );

    await this.request(url, z.unknown(), {
      method: "POST",
      body: JSON.stringify(parsedBody),
    });
  }

  async listControls(
    params: ListControlsParams = {},
  ): Promise<ListControlsResponse> {
    const url = this.url("/v1/controls", params);
    return this.request(url, ListControlsResponseSchema);
  }

  async setControlOwner(
    controlId: string,
    body: SetControlOwnerRequest,
  ): Promise<void> {
    const parsedBody = SetControlOwnerRequestSchema.parse(body);
    const url = this.url(
      `/v1/controls/${encodeURIComponent(controlId)}/set-owner`,
    );

    await this.request(url, z.unknown(), {
      method: "POST",
      body: JSON.stringify(parsedBody),
    });
  }

  async listDocuments(
    params: ListDocumentsParams = {},
  ): Promise<ListDocumentsResponse> {
    const url = this.url("/v1/documents", params);
    return this.request(url, ListDocumentsResponseSchema);
  }

  async listControlDocuments(
    params: ListControlDocumentsParams,
  ): Promise<ListDocumentsResponse> {
    const { controlId, ...query } = params;
    const url = this.url(
      `/v1/controls/${encodeURIComponent(controlId)}/documents`,
      query,
    );
    return this.request(url, ListDocumentsResponseSchema);
  }

  async uploadDocumentFile(
    documentId: string,
    input: UploadDocumentFileInput,
  ): Promise<UploadDocumentFileResponse> {
    const form = new FormData();
    form.append("file", input.file, input.fileName);
    if (input.effectiveAtDate) {
      form.append("effectiveAtDate", input.effectiveAtDate);
    }
    if (input.description) {
      form.append("description", input.description);
    }

    const url = this.url(
      `/v1/documents/${encodeURIComponent(documentId)}/uploads`,
    );

    return this.request(url, UploadDocumentFileResponseSchema, {
      method: "POST",
      body: form,
    });
  }

  async submitDocument(documentId: string): Promise<void> {
    const url = this.url(
      `/v1/documents/${encodeURIComponent(documentId)}/submit`,
    );

    await this.request(url, z.unknown(), {
      method: "POST",
    });
  }

  private async request<T>(
    url: URL,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const accessToken = await this.accessTokenProvider();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (shouldSetJsonContentType(init.body) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetchFn(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new VantaApiError(
        `Vanta API request failed with HTTP ${response.status}`,
        response.status,
        body,
      );
    }

    if (response.status === 202 || response.status === 204) {
      return schema.parse(undefined);
    }

    return schema.parse(await response.json());
  }

  private url(pathname: string, query: Record<string, unknown> = {}): URL {
    const url = new URL(pathname, this.baseUrl);

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    return url;
  }
}

function shouldSetJsonContentType(body: BodyInit | null | undefined): boolean {
  return body !== undefined && body !== null && !(body instanceof FormData);
}
