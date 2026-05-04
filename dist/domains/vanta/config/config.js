import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
const DEFAULT_SCOPE = "vanta-api.all:read vanta-api.all:write";
const VantaCredentialsFileSchema = z
    .object({
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    scope: z.string().min(1).optional(),
})
    .passthrough();
const VantaConfigSchema = z.object({
    clientId: z
        .string({ required_error: "Vanta OAuth client ID is required" })
        .min(1, "Vanta OAuth client ID is required"),
    clientSecret: z
        .string({ required_error: "Vanta OAuth client secret is required" })
        .min(1, "Vanta OAuth client secret is required"),
    scope: z.string().min(1).default(DEFAULT_SCOPE),
    baseUrl: z.string().url().default("https://api.vanta.com"),
    tokenCachePath: z.string().min(1).default(defaultTokenCachePath(process.env)),
    credentialsFilePath: z.string().min(1),
});
export function loadVantaConfig(input = {}) {
    const env = input.env ?? process.env;
    const credentialsFilePath = input.credentialsFilePath ??
        env.VANTA_ENV_FILE ??
        env.VANTA_CREDENTIALS_FILE ??
        defaultCredentialsFilePath(env);
    const credentials = readCredentialsFile(credentialsFilePath);
    return VantaConfigSchema.parse({
        clientId: input.clientId ?? env.VANTA_CLIENT_ID ?? credentials?.client_id,
        clientSecret: input.clientSecret ??
            env.VANTA_CLIENT_SECRET ??
            credentials?.client_secret,
        scope: input.scope ??
            env.VANTA_OAUTH_SCOPE ??
            credentials?.scope ??
            DEFAULT_SCOPE,
        baseUrl: input.baseUrl ?? env.VANTA_BASE_URL ?? "https://api.vanta.com",
        tokenCachePath: input.tokenCachePath ??
            env.VANTA_TOKEN_CACHE_PATH ??
            defaultTokenCachePath(env),
        credentialsFilePath,
    });
}
function readCredentialsFile(path) {
    try {
        return VantaCredentialsFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    }
    catch {
        return null;
    }
}
function defaultCredentialsFilePath(env) {
    return join(env.HOME ?? process.env.HOME ?? ".", ".config", "vanta", "credentials.json");
}
function defaultTokenCachePath(env) {
    return join(env.HOME ?? process.env.HOME ?? ".", ".config", "vanta", "oauth-token-cache.json");
}
