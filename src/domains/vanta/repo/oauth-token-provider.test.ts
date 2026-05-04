import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VantaConfig } from "../config/config.js";
import {
  type VantaOAuthError,
  createOAuthAccessTokenProvider,
} from "./oauth-token-provider.js";
import type { FetchFn } from "./vanta-api-client.js";

const tmpDirs: string[] = [];

afterEach(async () => {
  for (const dir of tmpDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

async function config(): Promise<VantaConfig> {
  const dir = await mkdtemp(join(tmpdir(), "vanta-cli-test-"));
  tmpDirs.push(dir);
  return {
    clientId: "vci_client",
    clientSecret: "vcs_secret",
    scope: "vanta-api.all:read vanta-api.all:write",
    baseUrl: "https://api.vanta.test",
    tokenCachePath: join(dir, "oauth-token.json"),
    credentialsFilePath: join(dir, "credentials.json"),
  };
}

describe("createOAuthAccessTokenProvider", () => {
  it("requests a client-credentials access token and caches it", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({
        access_token: "vat_token",
        expires_in: 3599,
        token_type: "Bearer",
      }),
    );
    const provider = createOAuthAccessTokenProvider(
      await config(),
      fetchFn as unknown as FetchFn,
      () => 1_000,
    );

    await expect(provider()).resolves.toBe("vat_token");
    await expect(provider()).resolves.toBe("vat_token");

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://api.vanta.test/oauth/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      client_id: "vci_client",
      client_secret: "vcs_secret",
      scope: "vanta-api.all:read vanta-api.all:write",
      grant_type: "client_credentials",
    });
  });

  it("refreshes an expired cached access token", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          access_token: "vat_old",
          expires_in: 1,
          token_type: "Bearer",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          access_token: "vat_new",
          expires_in: 3599,
          token_type: "Bearer",
        }),
      );
    const vantaConfig = await config();

    await expect(
      createOAuthAccessTokenProvider(
        vantaConfig,
        fetchFn as unknown as FetchFn,
        () => 1_000,
      )(),
    ).resolves.toBe("vat_old");
    await expect(
      createOAuthAccessTokenProvider(
        vantaConfig,
        fetchFn as unknown as FetchFn,
        () => 10_000,
      )(),
    ).resolves.toBe("vat_new");
  });

  it("surfaces OAuth errors", async () => {
    const fetchFn = vi.fn(async () => new Response("bad", { status: 401 }));

    await expect(
      createOAuthAccessTokenProvider(
        await config(),
        fetchFn as unknown as FetchFn,
      )(),
    ).rejects.toMatchObject<VantaOAuthError>({
      status: 401,
      body: "bad",
    });
  });
});
