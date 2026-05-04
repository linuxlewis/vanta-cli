import { z } from "zod";

const VantaConfigSchema = z.object({
  token: z
    .string({ required_error: "Vanta API token is required" })
    .min(1, "Vanta API token is required"),
  baseUrl: z.string().url().default("https://api.vanta.com"),
});

export type VantaConfig = z.infer<typeof VantaConfigSchema>;

export type VantaConfigInput = {
  token?: string;
  baseUrl?: string;
  env?: NodeJS.ProcessEnv;
};

export function loadVantaConfig(input: VantaConfigInput = {}): VantaConfig {
  const env = input.env ?? process.env;

  return VantaConfigSchema.parse({
    token: input.token ?? env.VANTA_API_TOKEN,
    baseUrl: input.baseUrl ?? env.VANTA_BASE_URL ?? "https://api.vanta.com",
  });
}
