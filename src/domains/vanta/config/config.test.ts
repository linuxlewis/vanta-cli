import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadVantaConfig } from "./config.js";

describe("loadVantaConfig", () => {
  it("loads OAuth client credentials from the default MCP-style JSON file", () => {
    const home = mkdtempSync(join(tmpdir(), "vanta-cli-home-"));
    const credentialsFilePath = join(
      home,
      ".config",
      "vanta",
      "credentials.json",
    );
    mkdirSync(join(home, ".config", "vanta"), { recursive: true });
    writeFileSync(
      credentialsFilePath,
      JSON.stringify({
        client_id: "vci_file_client",
        client_secret: "vcs_file_secret",
      }),
    );

    expect(loadVantaConfig({ env: { HOME: home } })).toEqual({
      clientId: "vci_file_client",
      clientSecret: "vcs_file_secret",
      scope: "vanta-api.all:read vanta-api.all:write",
      baseUrl: "https://api.vanta.com",
      tokenCachePath: join(home, ".config", "vanta", "oauth-token-cache.json"),
      credentialsFilePath,
    });
  });

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
      tokenCachePath: "/tmp/home/.config/vanta/oauth-token-cache.json",
      credentialsFilePath: "/tmp/home/.config/vanta/credentials.json",
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
        credentialsFilePath: "/tmp/credentials.json",
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
      credentialsFilePath: "/tmp/credentials.json",
    });
  });

  it("supports the Vanta MCP server VANTA_ENV_FILE variable", () => {
    const dir = mkdtempSync(join(tmpdir(), "vanta-cli-creds-"));
    const credentialsFilePath = join(dir, "credentials.json");
    writeFileSync(
      credentialsFilePath,
      JSON.stringify({
        client_id: "vci_mcp_client",
        client_secret: "vcs_mcp_secret",
        scope: "vanta-api.all:read",
      }),
    );

    expect(
      loadVantaConfig({
        env: { HOME: "/tmp/home", VANTA_ENV_FILE: credentialsFilePath },
      }),
    ).toMatchObject({
      clientId: "vci_mcp_client",
      clientSecret: "vcs_mcp_secret",
      scope: "vanta-api.all:read",
      credentialsFilePath,
    });
  });

  it("fails when OAuth client credentials are missing", () => {
    const home = mkdtempSync(join(tmpdir(), "vanta-cli-empty-home-"));
    expect(() => loadVantaConfig({ env: { HOME: home } })).toThrow(
      "Vanta OAuth client ID",
    );
  });
});
