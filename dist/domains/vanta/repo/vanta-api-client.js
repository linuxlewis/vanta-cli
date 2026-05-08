import { z } from "zod";
import { DeactivateTestEntityRequestSchema, ListControlsResponseSchema, ListDocumentsResponseSchema, ListTestEntitiesResponseSchema, ListTestsResponseSchema, SetControlOwnerRequestSchema, UploadDocumentFileResponseSchema, } from "../types/schemas.js";
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
    async listControls(params = {}) {
        const url = this.url("/v1/controls", params);
        return this.request(url, ListControlsResponseSchema);
    }
    async setControlOwner(controlId, body) {
        const parsedBody = SetControlOwnerRequestSchema.parse(body);
        const url = this.url(`/v1/controls/${encodeURIComponent(controlId)}/set-owner`);
        await this.request(url, z.unknown(), {
            method: "POST",
            body: JSON.stringify(parsedBody),
        });
    }
    async listDocuments(params = {}) {
        const url = this.url("/v1/documents", params);
        return this.request(url, ListDocumentsResponseSchema);
    }
    async listControlDocuments(params) {
        const { controlId, ...query } = params;
        const url = this.url(`/v1/controls/${encodeURIComponent(controlId)}/documents`, query);
        return this.request(url, ListDocumentsResponseSchema);
    }
    async uploadDocumentFile(documentId, input) {
        const form = new FormData();
        form.append("file", input.file, input.fileName);
        if (input.effectiveAtDate) {
            form.append("effectiveAtDate", input.effectiveAtDate);
        }
        if (input.description) {
            form.append("description", input.description);
        }
        const url = this.url(`/v1/documents/${encodeURIComponent(documentId)}/uploads`);
        return this.request(url, UploadDocumentFileResponseSchema, {
            method: "POST",
            body: form,
        });
    }
    async submitDocument(documentId) {
        const url = this.url(`/v1/documents/${encodeURIComponent(documentId)}/submit`);
        await this.request(url, z.unknown(), {
            method: "POST",
        });
    }
    async request(url, schema, init = {}) {
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
            if (value === undefined || value === "") {
                continue;
            }
            if (Array.isArray(value)) {
                for (const item of value) {
                    url.searchParams.append(key, String(item));
                }
            }
            else {
                url.searchParams.set(key, String(value));
            }
        }
        return url;
    }
}
function shouldSetJsonContentType(body) {
    return body !== undefined && body !== null && !(body instanceof FormData);
}
