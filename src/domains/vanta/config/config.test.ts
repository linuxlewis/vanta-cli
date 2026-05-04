import { describe, expect, it } from "vitest";
import { loadVantaConfig } from "./config.js";

describe("loadVantaConfig", () => {
  it("loads OAuth client credentials from env and defaults API settings", () => {
    expect(
      loadVantaConfig({
        env: {
          HOME: "/tmp/home",
          VANTA_CLIENT_ID: "vci_client",
          VANTA_CLIENT_SECRET: "vcs_secret",
        },
      }),
    ).toEqual({
      clientId: "vci_client",
      clientSecret: "vcs_secret",
      scope: "vanta-api.all:read vanta-api.all:write",
      baseUrl: "https://api.vanta.com",
      tokenCachePath: "/tmp/home/.vanta-cli/oauth-token.json",
    });
  });

  it("allows CLI options to override env", () => {
    expect(
      loadVantaConfig({
        clientId: "cli_client",
        clientSecret: "cli_secret",
        scope: "vanta-api.all:read",
        baseUrl: "https://proxy.example.test",
        tokenCachePath: "/tmp/cache.json",
        env: {
          VANTA_CLIENT_ID: "env_client",
          VANTA_CLIENT_SECRET: "env_secret",
        },
      }),
    ).toEqual({
      clientId: "cli_client",
      clientSecret: "cli_secret",
      scope: "vanta-api.all:read",
      baseUrl: "https://proxy.example.test",
      tokenCachePath: "/tmp/cache.json",
    });
  });

  it("fails when OAuth client credentials are missing", () => {
    expect(() => loadVantaConfig({ env: {} })).toThrow("Vanta OAuth client ID");
  });
});
