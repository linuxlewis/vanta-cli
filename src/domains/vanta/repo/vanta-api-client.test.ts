import { describe, expect, it, vi } from "vitest";
import { type FetchFn, VantaApiClient } from "./vanta-api-client.js";

type FetchCall = [URL | RequestInfo, RequestInit | undefined];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestHeaders(init: RequestInit | undefined): Headers {
  return new Headers(init?.headers);
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
    expect(requestHeaders(init).get("Accept")).toBe("application/json");
    expect(requestHeaders(init).get("Authorization")).toBe("Bearer vat_token");
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

  it("lists controls with repeated framework filters", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        results: { data: [{ id: "lcckzq29", externalId: "AST-78" }] },
      }),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.listControls({
      frameworkMatchesAny: ["nist53", "soc2"],
      pageSize: 100,
    });

    const [url] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/controls?frameworkMatchesAny=nist53&frameworkMatchesAny=soc2&pageSize=100",
    );
  });

  it("sets a control owner", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.setControlOwner("AST-78", { userId: "user_1" });

    const [url, init] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/controls/AST-78/set-owner",
    );
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ userId: "user_1" }));
  });

  it("lists documents with repeated framework and status filters", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: { data: [{ id: "access-requests" }] } }),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.listDocuments({
      frameworkMatchesAny: ["nist53", "soc2"],
      statusMatchesAny: ["Needs document", "OK"],
      pageSize: 100,
    });

    const [url] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/documents?frameworkMatchesAny=nist53&frameworkMatchesAny=soc2&statusMatchesAny=Needs+document&statusMatchesAny=OK&pageSize=100",
    );
  });

  it("lists documents for a control", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: { data: [{ id: "access-requests" }] } }),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.listControlDocuments({
      controlId: "AST-78",
      pageSize: 50,
    });

    const [url] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/controls/AST-78/documents?pageSize=50",
    );
  });

  it("uploads a document file as multipart form data", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(
        {
          id: "upload_1",
          fileName: "access-review.png",
          mimeType: "image/png",
        },
        201,
      ),
    );
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    const result = await client.uploadDocumentFile("access-requests", {
      file: new Blob(["screenshot"], { type: "image/png" }),
      fileName: "access-review.png",
      description: "Quarterly access review",
      effectiveAtDate: "2026-05-06T00:00:00.000Z",
    });

    const [url, init] = fetchFn.mock.calls[0] as unknown as FetchCall;
    const headers = requestHeaders(init);
    const body = init?.body as FormData;
    const file = body.get("file") as File;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/documents/access-requests/uploads",
    );
    expect(init?.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer vat_token");
    expect(headers.has("Content-Type")).toBe(false);
    expect(body).toBeInstanceOf(FormData);
    expect(file.name).toBe("access-review.png");
    expect(file.type).toBe("image/png");
    expect(body.get("description")).toBe("Quarterly access review");
    expect(body.get("effectiveAtDate")).toBe("2026-05-06T00:00:00.000Z");
    expect(result.id).toBe("upload_1");
  });

  it("submits a document collection", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    const client = new VantaApiClient(
      { baseUrl: "https://api.vanta.test" },
      async () => "vat_token",
      fetchFn as unknown as FetchFn,
    );

    await client.submitDocument("access-requests");

    const [url, init] = fetchFn.mock.calls[0] as unknown as FetchCall;
    expect(String(url)).toBe(
      "https://api.vanta.test/v1/documents/access-requests/submit",
    );
    expect(init?.method).toBe("POST");
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
