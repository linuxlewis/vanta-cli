import { describe, expect, it } from "vitest";
import { loadVantaConfig } from "./config.js";

describe("loadVantaConfig", () => {
  it("loads token from env and defaults the base URL", () => {
    expect(loadVantaConfig({ env: { VANTA_API_TOKEN: "vat_token" } })).toEqual({
      token: "vat_token",
      baseUrl: "https://api.vanta.com",
    });
  });

  it("allows CLI options to override env", () => {
    expect(
      loadVantaConfig({
        token: "cli_token",
        baseUrl: "https://proxy.example.test",
        env: { VANTA_API_TOKEN: "env_token" },
      }),
    ).toEqual({
      token: "cli_token",
      baseUrl: "https://proxy.example.test",
    });
  });

  it("fails when no token is present", () => {
    expect(() => loadVantaConfig({ env: {} })).toThrow("Vanta API token");
  });
});
