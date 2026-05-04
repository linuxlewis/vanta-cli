import { Command } from "commander";
import { loadVantaConfig } from "../config/config.js";
import { createOAuthAccessTokenProvider } from "../repo/oauth-token-provider.js";
import { VantaApiClient } from "../repo/vanta-api-client.js";
import {
  type VantaTestService,
  createVantaTestService,
  parseEntityStatus,
} from "../service/test-service.js";
import { TestCategorySchema, TestStatusSchema } from "../types/schemas.js";

type OutputWriter = {
  write(message: string): void;
  error(message: string): void;
};

type CliDependencies = {
  service?: VantaTestService;
  output?: OutputWriter;
  fetchFn?: typeof fetch;
};

const processOutput: OutputWriter = {
  write(message) {
    process.stdout.write(message);
  },
  error(message) {
    process.stderr.write(message);
  },
};

export function createVantaCli(dependencies: CliDependencies = {}): Command {
  const program = new Command();
  const output = dependencies.output ?? processOutput;

  program
    .name("vanta-cli")
    .description("Automation-friendly CLI for Vanta test workflows")
    .option(
      "--client-id <clientId>",
      "Vanta OAuth client ID; defaults to VANTA_CLIENT_ID",
    )
    .option(
      "--client-secret <clientSecret>",
      "Vanta OAuth client secret; defaults to VANTA_CLIENT_SECRET",
    )
    .option(
      "--scope <scope>",
      "OAuth scope string",
      "vanta-api.all:read vanta-api.all:write",
    )
    .option(
      "--token-cache-path <path>",
      "OAuth access-token cache path; defaults to ~/.config/vanta/oauth-token-cache.json",
    )
    .option(
      "--credentials-file <path>",
      "MCP-style OAuth credentials JSON file; defaults to ~/.config/vanta/credentials.json",
    )
    .option("--base-url <url>", "Vanta API base URL", "https://api.vanta.com")
    .showHelpAfterError()
    .configureOutput({
      writeOut: (message) => output.write(message),
      writeErr: (message) => output.error(message),
    });

  const tests = program.command("tests").description("Work with Vanta tests");

  tests
    .command("list")
    .description("List Vanta tests")
    .option("--status <status>", "Filter by test status")
    .option("--category <category>", "Filter by test category")
    .option("--framework <framework>", "Filter by framework")
    .option("--integration <integration>", "Filter by integration")
    .option("--control <control>", "Filter by control ID")
    .option("--owner <owner>", "Filter by owner ID")
    .option("--rollout <rollout>", "Filter by rollout status: true or false")
    .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
    .option("--page-cursor <cursor>", "Page cursor")
    .action(async (options) => {
      const service =
        dependencies.service ?? createService(program, dependencies.fetchFn);
      const result = await service.listTests({
        statusFilter: options.status
          ? TestStatusSchema.parse(options.status)
          : undefined,
        categoryFilter: options.category
          ? TestCategorySchema.parse(options.category)
          : undefined,
        frameworkFilter: options.framework,
        integrationFilter: options.integration,
        controlFilter: options.control,
        ownerFilter: options.owner,
        isInRollout:
          options.rollout === undefined
            ? undefined
            : parseBoolean(options.rollout),
        pageSize: options.pageSize,
        pageCursor: options.pageCursor,
      });
      writeJson(output, result);
    });

  tests
    .command("entities")
    .description("List entities for a Vanta test")
    .requiredOption("--test-id <testId>", "Vanta test ID")
    .option(
      "--status <status>",
      "Entity status: FAILING or DEACTIVATED",
      "FAILING",
    )
    .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
    .option("--page-cursor <cursor>", "Page cursor")
    .action(async (options) => {
      const service =
        dependencies.service ?? createService(program, dependencies.fetchFn);
      const result = await service.listTestEntities({
        testId: options.testId,
        entityStatus: parseEntityStatus(options.status),
        pageSize: options.pageSize,
        pageCursor: options.pageCursor,
      });
      writeJson(output, result);
    });

  tests
    .command("deactivate-entities")
    .description("Deactivate selected entities for a Vanta test")
    .requiredOption("--test-id <testId>", "Vanta test ID")
    .option(
      "--entity-id <entityId>",
      "Entity ID; repeat for multiple",
      collect,
      [],
    )
    .requiredOption("--reason <reason>", "Reason for deactivation")
    .option(
      "--until <date>",
      "ISO date-time until which the entity is deactivated",
    )
    .option(
      "--dry-run",
      "Print the actions without calling the deactivate endpoint",
    )
    .action(async (options) => {
      const service =
        dependencies.service ?? createService(program, dependencies.fetchFn);
      if (options.entityId.length === 0) {
        throw new Error("At least one --entity-id is required");
      }
      const result = await service.deactivateEntities({
        testId: options.testId,
        entityIds: options.entityId,
        reason: options.reason,
        until: options.until,
        dryRun: options.dryRun,
      });
      writeJson(output, { data: result });
    });

  return program;
}

function createService(
  program: Command,
  fetchFn?: typeof fetch,
): VantaTestService {
  const options = program.opts<{
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    baseUrl?: string;
    tokenCachePath?: string;
    credentialsFile?: string;
  }>();
  const config = loadVantaConfig({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scope: options.scope,
    baseUrl: options.baseUrl,
    tokenCachePath: options.tokenCachePath,
    credentialsFilePath: options.credentialsFile,
  });
  return createVantaTestService(
    new VantaApiClient(
      config,
      createOAuthAccessTokenProvider(config, fetchFn),
      fetchFn,
    ),
  );
}

function writeJson(output: OutputWriter, value: unknown): void {
  output.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer: ${value}`);
  }
  return parsed;
}

function parseBoolean(value: string): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`Invalid boolean: ${value}`);
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}
