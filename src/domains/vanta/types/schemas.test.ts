import { describe, expect, it } from "vitest";
import {
  DeactivateTestEntityRequestSchema,
  ListTestEntitiesResponseSchema,
  ListTestsResponseSchema,
  OAuthTokenResponseSchema,
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

  it("parses an OAuth token response", () => {
    const parsed = OAuthTokenResponseSchema.parse({
      access_token: "vat_token",
      expires_in: 3599,
      token_type: "Bearer",
    });

    expect(parsed.access_token).toBe("vat_token");
  });
});
