export function createVantaTestService(client) {
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
            const request = {
                deactivateReason: input.reason,
                ...(input.until ? { deactivateUntilDate: input.until } : {}),
            };
            const results = [];
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
export function parseEntityStatus(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === "FAILING" || value === "DEACTIVATED") {
        return value;
    }
    throw new Error(`Invalid entity status: ${value}`);
}
