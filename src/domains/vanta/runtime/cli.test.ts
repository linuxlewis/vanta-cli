import { describe, expect, it, vi } from "vitest";
import { createVantaCli } from "./cli.js";

function createOutput() {
  let stdout = "";
  let stderr = "";
  return {
    writer: {
      write(message: string) {
        stdout += message;
      },
      error(message: string) {
        stderr += message;
      },
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

describe("createVantaCli", () => {
  it("wires test listing filters to the service", async () => {
    const output = createOutput();
    const service = {
      listTests: vi.fn(async () => ({ data: [{ id: "test_1" }] })),
      listTestEntities: vi.fn(),
      deactivateEntities: vi.fn(),
    };
    const cli = createVantaCli({ service, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "tests",
      "list",
      "--status",
      "NEEDS_ATTENTION",
      "--category",
      "INFRASTRUCTURE",
    ]);

    expect(service.listTests).toHaveBeenCalledWith({
      statusFilter: "NEEDS_ATTENTION",
      categoryFilter: "INFRASTRUCTURE",
      frameworkFilter: undefined,
      integrationFilter: undefined,
      controlFilter: undefined,
      ownerFilter: undefined,
      isInRollout: undefined,
      pageSize: undefined,
      pageCursor: undefined,
    });
    expect(JSON.parse(output.stdout)).toEqual({ data: [{ id: "test_1" }] });
  });

  it("wires entity deactivation with dry-run options", async () => {
    const output = createOutput();
    const service = {
      listTests: vi.fn(),
      listTestEntities: vi.fn(),
      deactivateEntities: vi.fn(async () => [
        {
          testId: "test_1",
          entityId: "entity_1",
          action: "would_deactivate" as const,
        },
      ]),
    };
    const cli = createVantaCli({ service, output: output.writer });

    await cli.parseAsync([
      "node",
      "vanta-cli",
      "tests",
      "deactivate-entities",
      "--test-id",
      "test_1",
      "--entity-id",
      "entity_1",
      "--entity-id",
      "entity_2",
      "--reason",
      "Accepted risk",
      "--dry-run",
    ]);

    expect(service.deactivateEntities).toHaveBeenCalledWith({
      testId: "test_1",
      entityIds: ["entity_1", "entity_2"],
      reason: "Accepted risk",
      until: undefined,
      dryRun: true,
    });
    expect(JSON.parse(output.stdout)).toEqual({
      data: [
        {
          testId: "test_1",
          entityId: "entity_1",
          action: "would_deactivate",
        },
      ],
    });
  });
});
