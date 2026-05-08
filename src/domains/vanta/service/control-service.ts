import type {
  ListControlsParams,
  VantaApiClient,
} from "../repo/vanta-api-client.js";
import type { PageInfo, VantaControl } from "../types/schemas.js";

export type SetControlOwnerInput = {
  controlId: string;
  userId: string;
  dryRun?: boolean;
};

export type SetControlOwnerResult = {
  controlId: string;
  userId: string;
  action: "set" | "would_set";
};

export type VantaControlService = {
  listControls(params: ListControlsParams): Promise<{
    data: VantaControl[];
    pageInfo?: PageInfo;
  }>;
  setOwner(input: SetControlOwnerInput): Promise<SetControlOwnerResult>;
};

export type VantaControlApi = Pick<
  VantaApiClient,
  "listControls" | "setControlOwner"
>;

export function createVantaControlService(
  client: VantaControlApi,
): VantaControlService {
  return {
    async listControls(params) {
      const response = await client.listControls(params);
      return {
        data: response.results.data,
        pageInfo: response.results.pageInfo,
      };
    },

    async setOwner({ controlId, userId, dryRun }) {
      if (dryRun) {
        return { controlId, userId, action: "would_set" };
      }

      await client.setControlOwner(controlId, { userId });
      return { controlId, userId, action: "set" };
    },
  };
}
