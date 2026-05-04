import { describe, expect, it, vi } from "vitest";
import { type FetchFn, VantaApiClient } from "./vanta-api-client.js";

type FetchCall = [URL | RequestInfo, RequestInit | undefined];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("VantaApiClient", () => {
  it("lists tests with filters", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: { data: [{ id: "test_1" }] } }),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.listTests({
      statusFilter: "NEEDS_ATTENTION",
      categoryFilter: "INFRASTRUCTURE",
      pageSize: 50,
    });

    const [url, init] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/tests?statusFilter=NEEDS_ATTENTION&categoryFilter=INFRASTRUCTURE&pageSize=50",
    );
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer vat_token",
    });
  });

  it("lists test entities by test ID", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: { data: [{ id: "entity_1" }] } }),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.listTestEntities({
      testId: "inventory-list-descriptions",
      entityStatus: "FAILING",
    });

    const [url] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/tests/inventory-list-descriptions/entities?entityStatus=FAILING",
    );
  });

  it("deactivates a test entity with a reason and optional date", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 202 }));
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.deactivateTestEntity("test_1", "entity_1", {
      deactivateReason: "Accepted risk",
      deactivateUntilDate: "2026-12-31T00:00:00.000Z",
    });

    const [url, init] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/tests/test_1/entities/entity_1/deactivate",
    );
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      JSON.stringify({
        deactivateReason: "Accepted risk",
        deactivateUntilDate: "2026-12-31T00:00:00.000Z",
      }),
    );
  });

  it("surfaces Vanta error responses", async () => {
    const fetchFn = vi.fn(async () => new Response("nope", { status: 401 }));
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "bad",
      fetchFn as unknown as FetchFn,
    );

    await expect(client.listTests()).rejects.toMatchObject({
      status: 401,
      body: "nope",
    });
  });
});
