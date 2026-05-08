import { Command } from "commander";
import { loadVantaConfig } from "../config/config.js";
import { createOAuthAccessTokenProvider } from "../repo/oauth-token-provider.js";
import { VantaApiClient } from "../repo/vanta-api-client.js";
import { createVantaControlService, } from "../service/control-service.js";
import { createVantaDocumentService, } from "../service/document-service.js";
import { createVantaTestService, parseEntityStatus, } from "../service/test-service.js";
import { DocumentStatusSchema, TestCategorySchema, TestStatusSchema, } from "../types/schemas.js";
const processOutput = {
    write(message) {
        process.stdout.write(message);
    },
    error(message) {
        process.stderr.write(message);
    },
};
export function createVantaCli(dependencies = {}) {
    const program = new Command();
    const output = dependencies.output ?? processOutput;
    program
        .name("vanta-cli")
        .description("Automation-friendly CLI for Vanta workflows")
        .option("--client-id <clientId>", "Vanta OAuth client ID; defaults to VANTA_CLIENT_ID")
        .option("--client-secret <clientSecret>", "Vanta OAuth client secret; defaults to VANTA_CLIENT_SECRET")
        .option("--scope <scope>", "OAuth scope string", "vanta-api.all:read vanta-api.all:write")
        .option("--token-cache-path <path>", "OAuth access-token cache path; defaults to ~/.config/vanta/oauth-token-cache.json")
        .option("--credentials-file <path>", "MCP-style OAuth credentials JSON file; defaults to ~/.config/vanta/credentials.json")
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
        const service = dependencies.testService ??
            createTestService(program, dependencies.fetchFn);
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
            isInRollout: options.rollout === undefined
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
        .option("--status <status>", "Entity status: FAILING or DEACTIVATED", "FAILING")
        .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
        .option("--page-cursor <cursor>", "Page cursor")
        .action(async (options) => {
        const service = dependencies.testService ??
            createTestService(program, dependencies.fetchFn);
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
        .option("--entity-id <entityId>", "Entity ID; repeat for multiple", collect, [])
        .requiredOption("--reason <reason>", "Reason for deactivation")
        .option("--until <date>", "ISO date-time until which the entity is deactivated")
        .option("--dry-run", "Print the actions without calling the deactivate endpoint")
        .action(async (options) => {
        const service = dependencies.testService ??
            createTestService(program, dependencies.fetchFn);
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
    const controls = program
        .command("controls")
        .description("Work with Vanta controls");
    controls
        .command("list")
        .description("List Vanta controls")
        .option("--framework <framework>", "Framework ID to filter by; repeat for multiple", collect, [])
        .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
        .option("--page-cursor <cursor>", "Page cursor")
        .action(async (options) => {
        const service = dependencies.controlService ??
            createControlService(program, dependencies.fetchFn);
        const result = await service.listControls({
            frameworkMatchesAny: options.framework.length > 0 ? options.framework : undefined,
            pageSize: options.pageSize,
            pageCursor: options.pageCursor,
        });
        writeJson(output, result);
    });
    controls
        .command("documents")
        .description("List document requests attached to a Vanta control")
        .requiredOption("--control-id <controlId>", "Vanta control ID (id or externalId)")
        .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
        .option("--page-cursor <cursor>", "Page cursor")
        .action(async (options) => {
        const service = dependencies.documentService ??
            createDocumentService(program, dependencies.fetchFn);
        const result = await service.listControlDocuments({
            controlId: options.controlId,
            pageSize: options.pageSize,
            pageCursor: options.pageCursor,
        });
        writeJson(output, result);
    });
    controls
        .command("set-owner")
        .description("Set the owner of a Vanta control")
        .requiredOption("--control-id <controlId>", "Vanta control ID (id or externalId)")
        .requiredOption("--user-id <userId>", "Vanta user ID of the new owner")
        .option("--dry-run", "Print the action without calling the set-owner endpoint")
        .action(async (options) => {
        const service = dependencies.controlService ??
            createControlService(program, dependencies.fetchFn);
        const result = await service.setOwner({
            controlId: options.controlId,
            userId: options.userId,
            dryRun: options.dryRun,
        });
        writeJson(output, { data: result });
    });
    controls
        .command("upload-evidence")
        .description("Upload document or screenshot evidence for a Vanta control")
        .requiredOption("--control-id <controlId>", "Vanta control ID (id or externalId)")
        .requiredOption("--document-id <documentId>", "Vanta document ID")
        .requiredOption("--file <path>", "Path to the document or screenshot file")
        .option("--description <description>", "Description for the uploaded file")
        .option("--effective-at <date>", "ISO date-time when the evidence applies")
        .option("--filename <filename>", "Uploaded filename; defaults to basename")
        .option("--mime-type <mimeType>", "Uploaded file MIME type override")
        .option("--submit", "Submit the document collection after upload")
        .option("--dry-run", "Print the action without uploading or submitting")
        .option("--skip-control-document-check", "Skip checking whether the document belongs to the control")
        .action(async (options) => {
        const service = dependencies.documentService ??
            createDocumentService(program, dependencies.fetchFn);
        const result = await service.uploadControlEvidence({
            controlId: options.controlId,
            documentId: options.documentId,
            filePath: options.file,
            description: options.description,
            effectiveAtDate: options.effectiveAt,
            fileName: options.filename,
            mimeType: options.mimeType,
            submit: options.submit,
            dryRun: options.dryRun,
            skipControlDocumentCheck: options.skipControlDocumentCheck,
        });
        writeJson(output, { data: result });
    });
    const documents = program
        .command("documents")
        .description("Work with Vanta document evidence");
    documents
        .command("list")
        .description("List Vanta document requests")
        .option("--framework <framework>", "Framework ID to filter by; repeat for multiple", collect, [])
        .option("--status <status>", "Document status: Needs document, Needs update, Not relevant, or OK; repeat for multiple", collect, [])
        .option("--page-size <size>", "Page size, 1 to 100", parseInteger)
        .option("--page-cursor <cursor>", "Page cursor")
        .action(async (options) => {
        const service = dependencies.documentService ??
            createDocumentService(program, dependencies.fetchFn);
        const result = await service.listDocuments({
            frameworkMatchesAny: options.framework.length > 0 ? options.framework : undefined,
            statusMatchesAny: options.status.length > 0
                ? options.status.map((status) => DocumentStatusSchema.parse(status))
                : undefined,
            pageSize: options.pageSize,
            pageCursor: options.pageCursor,
        });
        writeJson(output, result);
    });
    documents
        .command("upload")
        .description("Upload document or screenshot evidence to a Vanta document")
        .requiredOption("--document-id <documentId>", "Vanta document ID")
        .requiredOption("--file <path>", "Path to the document or screenshot file")
        .option("--description <description>", "Description for the uploaded file")
        .option("--effective-at <date>", "ISO date-time when the evidence applies")
        .option("--filename <filename>", "Uploaded filename; defaults to basename")
        .option("--mime-type <mimeType>", "Uploaded file MIME type override")
        .option("--submit", "Submit the document collection after upload")
        .option("--dry-run", "Print the action without uploading or submitting")
        .action(async (options) => {
        const service = dependencies.documentService ??
            createDocumentService(program, dependencies.fetchFn);
        const result = await service.uploadDocumentEvidence({
            documentId: options.documentId,
            filePath: options.file,
            description: options.description,
            effectiveAtDate: options.effectiveAt,
            fileName: options.filename,
            mimeType: options.mimeType,
            submit: options.submit,
            dryRun: options.dryRun,
        });
        writeJson(output, { data: result });
    });
    return program;
}
function loadConfigFromProgram(program) {
    const options = program.opts();
    return loadVantaConfig({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        scope: options.scope,
        baseUrl: options.baseUrl,
        tokenCachePath: options.tokenCachePath,
        credentialsFilePath: options.credentialsFile,
    });
}
function createApiClient(program, fetchFn) {
    const config = loadConfigFromProgram(program);
    return new VantaApiClient(config, createOAuthAccessTokenProvider(config, fetchFn), fetchFn);
}
function createTestService(program, fetchFn) {
    return createVantaTestService(createApiClient(program, fetchFn));
}
function createControlService(program, fetchFn) {
    return createVantaControlService(createApiClient(program, fetchFn));
}
function createDocumentService(program, fetchFn) {
    return createVantaDocumentService(createApiClient(program, fetchFn));
}
function writeJson(output, value) {
    output.write(`${JSON.stringify(value, null, 2)}\n`);
}
function parseInteger(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) {
        throw new Error(`Invalid integer: ${value}`);
    }
    return parsed;
}
function parseBoolean(value) {
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    throw new Error(`Invalid boolean: ${value}`);
}
function collect(value, previous) {
    return [...previous, value];
}
