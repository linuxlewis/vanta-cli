import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { VantaConfig } from "../config/config.js";
import {
  type OAuthTokenCache,
  OAuthTokenCacheSchema,
  OAuthTokenResponseSchema,
} from "../types/schemas.js";
import type { FetchFn } from "./vanta-api-client.js";

const CACHE_SKEW_MS = 5 * 60 * 1000;

export class VantaOAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "VantaOAuthError";
  }
}

export type AccessTokenProvider = () => Promise<string>;

export function createOAuthAccessTokenProvider(
  config: VantaConfig,
  fetchFn: FetchFn = fetch,
  now: () => number = Date.now,
): AccessTokenProvider {
  return async () => {
    const cached = await readCachedToken(config.tokenCachePath);
    if (cached && isUsable(cached, now())) {
      return cached.accessToken;
    }

    const token = await requestAccessToken(config, fetchFn, now);
    await writeCachedToken(config.tokenCachePath, token);
    return token.accessToken;
  };
}

async function requestAccessToken(
  config: VantaConfig,
  fetchFn: FetchFn,
  now: () => number,
): Promise<OAuthTokenCache> {
  const url = new URL("/oauth/token", config.baseUrl);
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: config.scope,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new VantaOAuthError(
      `Vanta OAuth token request failed with HTTP ${response.status}`,
      response.status,
      body,
    );
  }

  const parsed = OAuthTokenResponseSchema.parse(await response.json());
  return {
    accessToken: parsed.access_token,
    expiresAt: now() + parsed.expires_in * 1000,
    tokenType: parsed.token_type,
  };
}

async function readCachedToken(path: string): Promise<OAuthTokenCache | null> {
  try {
    return OAuthTokenCacheSchema.parse(
      JSON.parse(await readFile(path, "utf8")),
    );
  } catch {
    return null;
  }
}

async function writeCachedToken(
  path: string,
  token: OAuthTokenCache,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(token), { mode: 0o600 });
}

function isUsable(token: OAuthTokenCache, now: number): boolean {
  return token.expiresAt - CACHE_SKEW_MS > now;
}
