import { z } from "zod";
import { DeactivateTestEntityRequestSchema, ListTestEntitiesResponseSchema, ListTestsResponseSchema, } from "../types/schemas.js";
export class VantaApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = "VantaApiError";
    }
}
export class VantaApiClient {
    baseUrl;
    fetchFn;
    accessTokenProvider;
    constructor(config, accessTokenProvider, fetchFn = fetch) {
        this.baseUrl = new URL(config.baseUrl);
        this.fetchFn = fetchFn;
        this.accessTokenProvider = accessTokenProvider;
    }
    async listTests(params = {}) {
        const url = this.url("/v1/tests", params);
        return this.request(url, ListTestsResponseSchema);
    }
    async listTestEntities(params) {
        const { testId, ...query } = params;
        const url = this.url(`/v1/tests/${encodeURIComponent(testId)}/entities`, query);
        return this.request(url, ListTestEntitiesResponseSchema);
    }
    async deactivateTestEntity(testId, entityId, body) {
        const parsedBody = DeactivateTestEntityRequestSchema.parse(body);
        const url = this.url(`/v1/tests/${encodeURIComponent(testId)}/entities/${encodeURIComponent(entityId)}/deactivate`);
        await this.request(url, z.unknown(), {
            method: "POST",
            body: JSON.stringify(parsedBody),
        });
    }
    async request(url, schema, init = {}) {
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
            throw new VantaApiError(`Vanta API request failed with HTTP ${response.status}`, response.status, body);
        }
        if (response.status === 202 || response.status === 204) {
            return schema.parse(undefined);
        }
        return schema.parse(await response.json());
    }
    url(pathname, query = {}) {
        const url = new URL(pathname, this.baseUrl);
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== "") {
                url.searchParams.set(key, String(value));
            }
        }
        return url;
    }
}
