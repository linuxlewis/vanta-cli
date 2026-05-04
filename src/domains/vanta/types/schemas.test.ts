import { describe, expect, it } from "vitest";
import {
  DeactivateTestEntityRequestSchema,
  ListTestEntitiesResponseSchema,
  ListTestsResponseSchema,
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
});
