import { z } from "zod";

const VantaConfigSchema = z.object({
  clientId: z
    .string({ required_error: "Vanta OAuth client ID is required" })
    .min(1, "Vanta OAuth client ID is required"),
  clientSecret: z
    .string({ required_error: "Vanta OAuth client secret is required" })
    .min(1, "Vanta OAuth client secret is required"),
  scope: z.string().min(1).default("vanta-api.all:read vanta-api.all:write"),
  baseUrl: z.string().url().default("https://api.vanta.com"),
  tokenCachePath: z
    .string()
    .min(1)
    .default(`${process.env.HOME ?? "."}/.vanta-cli/oauth-token.json`),
});

export type VantaConfig = z.infer<typeof VantaConfigSchema>;

export type VantaConfigInput = {
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  baseUrl?: string;
  tokenCachePath?: string;
  env?: NodeJS.ProcessEnv;
};

export function loadVantaConfig(input: VantaConfigInput = {}): VantaConfig {
  const env = input.env ?? process.env;

  return VantaConfigSchema.parse({
    clientId: input.clientId ?? env.VANTA_CLIENT_ID,
    clientSecret: input.clientSecret ?? env.VANTA_CLIENT_SECRET,
    scope:
      input.scope ??
      env.VANTA_OAUTH_SCOPE ??
      "vanta-api.all:read vanta-api.all:write",
    baseUrl: input.baseUrl ?? env.VANTA_BASE_URL ?? "https://api.vanta.com",
    tokenCachePath:
      input.tokenCachePath ??
      env.VANTA_TOKEN_CACHE_PATH ??
      `${env.HOME ?? process.env.HOME ?? "."}/.vanta-cli/oauth-token.json`,
  });
}
