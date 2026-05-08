import { describe, expect, it, vi } from "vitest";
import { createVantaControlService } from "./control-service.js";

describe("createVantaControlService", () => {
  it("returns a dry-run result without calling set-owner", async () => {
    const client = {
      listControls: vi.fn(),
      setControlOwner: vi.fn(),
    };
    const service = createVantaControlService(client);

    await expect(
      service.setOwner({
        controlId: "AST-78",
        userId: "user_1",
        dryRun: true,
      }),
    ).resolves.toEqual({
      controlId: "AST-78",
      userId: "user_1",
      action: "would_set",
    });
    expect(client.setControlOwner).not.toHaveBeenCalled();
  });

  it("sets the owner via the API client", async () => {
    const client = {
      listControls: vi.fn(),
      setControlOwner: vi.fn(),
    };
    const service = createVantaControlService(client);

    const result = await service.setOwner({
      controlId: "AST-78",
      userId: "user_1",
    });

    expect(client.setControlOwner).toHaveBeenCalledWith("AST-78", {
      userId: "user_1",
    });
    expect(result).toEqual({
      controlId: "AST-78",
      userId: "user_1",
      action: "set",
    });
  });

  it("unwraps the listControls response envelope", async () => {
    const client = {
      listControls: vi.fn(async () => ({
        results: {
          pageInfo: { hasNextPage: false, endCursor: "cursor" },
          data: [{ id: "lcckzq29", externalId: "AST-78" }],
        },
      })),
      setControlOwner: vi.fn(),
    };
    const service = createVantaControlService(client);

    await expect(
      service.listControls({ frameworkMatchesAny: ["nist53"] }),
    ).resolves.toEqual({
      data: [{ id: "lcckzq29", externalId: "AST-78" }],
      pageInfo: { hasNextPage: false, endCursor: "cursor" },
    });
  });
});
