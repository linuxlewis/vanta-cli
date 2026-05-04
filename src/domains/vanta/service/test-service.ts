import type {
  ListTestEntitiesParams,
  ListTestsParams,
  VantaApiClient,
} from "../repo/vanta-api-client.js";
import type {
  DeactivateTestEntityRequest,
  EntityStatus,
  PageInfo,
  VantaTest,
  VantaTestEntity,
} from "../types/schemas.js";

export type DeactivateEntitiesInput = {
  testId: string;
  entityIds: string[];
  reason: string;
  until?: string;
  dryRun?: boolean;
};

export type DeactivateEntityResult = {
  testId: string;
  entityId: string;
  action: "deactivated" | "would_deactivate";
};

export type VantaTestService = {
  listTests(params: ListTestsParams): Promise<{
    data: VantaTest[];
    pageInfo?: PageInfo;
  }>;
  listTestEntities(params: ListTestEntitiesParams): Promise<{
    data: VantaTestEntity[];
    pageInfo?: PageInfo;
  }>;
  deactivateEntities(
    input: DeactivateEntitiesInput,
  ): Promise<DeactivateEntityResult[]>;
};

export type VantaTestApi = Pick<
  VantaApiClient,
  "listTests" | "listTestEntities" | "deactivateTestEntity"
>;

export function createVantaTestService(client: VantaTestApi): VantaTestService {
  return {
    async listTests(params) {
      const response = await client.listTests(params);
      return {
        data: response.results.data,
        pageInfo: response.results.pageInfo,
      };
    },

    async listTestEntities(params) {
      const response = await client.listTestEntities(params);
      return {
        data: response.results.data,
        pageInfo: response.results.pageInfo,
      };
    },

    async deactivateEntities(input) {
      const request: DeactivateTestEntityRequest = {
        deactivateReason: input.reason,
        ...(input.until ? { deactivateUntilDate: input.until } : {}),
      };

      const results: DeactivateEntityResult[] = [];
      for (const entityId of input.entityIds) {
        if (input.dryRun) {
          results.push({
            testId: input.testId,
            entityId,
            action: "would_deactivate",
          });
          continue;
        }

        await client.deactivateTestEntity(input.testId, entityId, request);
        results.push({
          testId: input.testId,
          entityId,
          action: "deactivated",
        });
      }

      return results;
    },
  };
}

export function parseEntityStatus(
  value: string | undefined,
): EntityStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "FAILING" || value === "DEACTIVATED") {
    return value;
  }

  throw new Error(`Invalid entity status: ${value}`);
}
