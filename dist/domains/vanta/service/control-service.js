export function createVantaControlService(client) {
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
