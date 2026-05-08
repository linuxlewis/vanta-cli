import { describe, expect, it } from "vitest";
import {
  DeactivateTestEntityRequestSchema,
  ListControlsResponseSchema,
  ListDocumentsResponseSchema,
  ListTestEntitiesResponseSchema,
  ListTestsResponseSchema,
  OAuthTokenResponseSchema,
  SetControlOwnerRequestSchema,
  UploadDocumentFileResponseSchema,
} from "./schemas.js";

describe("Vanta schemas", () => {
  it("parses a list tests response", () => {
    const parsed = ListTestsResponseSchema.parse({
      results: {
        pageInfo: { hasNextPage: false, endCursor: "cursor" },
        data: [
          { id: "inventory-list-descriptions", status: "NEEDS_ATTENTION" },
        ],
      },
    });

    expect(parsed.results.data[0]?.id).toBe("inventory-list-descriptions");
  });

  it("parses a list test entities response", () => {
    const parsed = ListTestEntitiesResponseSchema.parse({
      results: {
        data: [{ id: "entity_123", entityStatus: "FAILING" }],
      },
    });

    expect(parsed.results.data[0]?.entityStatus).toBe("FAILING");
  });

  it("requires a deactivation reason", () => {
    expect(() =>
      DeactivateTestEntityRequestSchema.parse({ deactivateReason: "" }),
    ).toThrow();
  });

  it("parses a list controls response", () => {
    const parsed = ListControlsResponseSchema.parse({
      results: {
        data: [
          {
            id: "lcckzq29",
            externalId: "AST-78",
            name: "System Component Inventory",
            domains: ["ASSET_MANAGEMENT"],
            owner: null,
          },
        ],
      },
    });

    expect(parsed.results.data[0]?.externalId).toBe("AST-78");
  });

  it("requires a userId on set-owner requests", () => {
    expect(() => SetControlOwnerRequestSchema.parse({ userId: "" })).toThrow();
  });

  it("parses a list documents response", () => {
    const parsed = ListDocumentsResponseSchema.parse({
      results: {
        data: [
          {
            id: "access-requests",
            title: "Access request ticket and history",
            overallStatus: "Needs document",
            url: "https://app.vanta.com/documents/access-requests",
          },
        ],
      },
    });

    expect(parsed.results.data[0]?.overallStatus).toBe("Needs document");
  });

  it("parses an uploaded document file response", () => {
    const parsed = UploadDocumentFileResponseSchema.parse({
      id: "66a935ff0dfddd9e7c568558",
      fileName: "access-review.png",
      mimeType: "image/png",
      url: "https://app.vanta.com/doc/Manual%20Evidence",
    });

    expect(parsed.fileName).toBe("access-review.png");
  });

  it("parses an OAuth token response", () => {
    const parsed = OAuthTokenResponseSchema.parse({
      access_token: "vat_token",
      expires_in: 3599,
      token_type: "Bearer",
    });

    expect(parsed.access_token).toBe("vat_token");
  });
});
