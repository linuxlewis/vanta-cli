import { z } from "zod";
import type { VantaConfig } from "../config/config.js";
import {
  type DeactivateTestEntityRequest,
  DeactivateTestEntityRequestSchema,
  type EntityStatus,
  type ListTestEntitiesResponse,
  ListTestEntitiesResponseSchema,
  type ListTestsResponse,
  ListTestsResponseSchema,
  type TestCategory,
  type TestStatus,
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

  private async request<T>(
    url: URL,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const accessToken = await this.accessTokenProvider();
    const response = await this.fetchFn(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
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
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    return url;
  }
}
