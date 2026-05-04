import { describe, expect, it, vi } from "vitest";
import { createVantaTestService } from "./test-service.js";

describe("createVantaTestService", () => {
  it("returns a dry-run result without calling deactivate", async () => {
    const client = {
      listTests: vi.fn(),
      listTestEntities: vi.fn(),
      deactivateTestEntity: vi.fn(),
    };
    const service = createVantaTestService(client);

    await expect(
      service.deactivateEntities({
        testId: "test_1",
        entityIds: ["entity_1", "entity_2"],
        reason: "Accepted risk",
        dryRun: true,
      }),
    ).resolves.toEqual([
      { testId: "test_1", entityId: "entity_1", action: "would_deactivate" },
      { testId: "test_1", entityId: "entity_2", action: "would_deactivate" },
    ]);
    expect(client.deactivateTestEntity).not.toHaveBeenCalled();
  });

  it("deactivates every requested entity", async () => {
    const client = {
      listTests: vi.fn(),
      listTestEntities: vi.fn(),
      deactivateTestEntity: vi.fn(),
    };
    const service = createVantaTestService(client);

    await service.deactivateEntities({
      testId: "test_1",
      entityIds: ["entity_1", "entity_2"],
      reason: "Accepted risk",
      until: "2026-12-31T00:00:00.000Z",
    });

    expect(client.deactivateTestEntity).toHaveBeenCalledTimes(2);
    expect(client.deactivateTestEntity).toHaveBeenNthCalledWith(
      1,
      "test_1",
      "entity_1",
      {
        deactivateReason: "Accepted risk",
        deactivateUntilDate: "2026-12-31T00:00:00.000Z",
      },
    );
  });
});
