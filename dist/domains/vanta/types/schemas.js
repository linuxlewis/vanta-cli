import { z } from "zod";
export const TestStatusSchema = z.enum([
    "OK",
    "DEACTIVATED",
    "NEEDS_ATTENTION",
    "IN_PROGRESS",
    "INVALID",
    "NOT_APPLICABLE",
]);
export const TestCategorySchema = z.enum([
    "ACCOUNTS_ACCESS",
    "ACCOUNT_SECURITY",
    "ACCOUNT_SETUP",
    "COMPUTERS",
    "CUSTOM",
    "DATA_STORAGE",
    "EMPLOYEES",
    "INFRASTRUCTURE",
    "IT",
    "LOGGING",
    "MONITORING_ALERTS",
    "PEOPLE",
    "POLICIES",
    "RISK_ANALYSIS",
    "SECURITY_ALERT_MANAGEMENT",
    "SOFTWARE_DEVELOPMENT",
    "VENDORS",
    "VULNERABILITY_MANAGEMENT",
]);
export const EntityStatusSchema = z.enum(["FAILING", "DEACTIVATED"]);
export const PageInfoSchema = z.object({
    endCursor: z.string().nullable().optional(),
    hasNextPage: z.boolean().optional(),
    hasPreviousPage: z.boolean().optional(),
    startCursor: z.string().nullable().optional(),
});
export const VantaTestSchema = z
    .object({
    id: z.string(),
    name: z.string().optional(),
    status: TestStatusSchema.optional(),
    description: z.string().nullable().optional(),
    failureDescription: z.string().nullable().optional(),
    remediationDescription: z.string().nullable().optional(),
    lastTestRunDate: z.string().nullable().optional(),
    latestFlipDate: z.string().nullable().optional(),
})
    .passthrough();
export const VantaTestEntitySchema = z
    .object({
    id: z.string(),
    displayName: z.string().optional(),
    entityStatus: EntityStatusSchema.optional(),
    responseType: z.string().optional(),
    deactivatedReason: z.string().nullable().optional(),
    createdDate: z.string().nullable().optional(),
    lastUpdatedDate: z.string().nullable().optional(),
})
    .passthrough();
export const ListTestsResponseSchema = z.object({
    results: z.object({
        pageInfo: PageInfoSchema.optional(),
        data: z.array(VantaTestSchema),
    }),
});
export const ListTestEntitiesResponseSchema = z.object({
    results: z.object({
        pageInfo: PageInfoSchema.optional(),
        data: z.array(VantaTestEntitySchema),
    }),
});
export const DeactivateTestEntityRequestSchema = z.object({
    deactivateReason: z.string().min(1),
    deactivateUntilDate: z.string().datetime().optional(),
});
export const OAuthTokenResponseSchema = z.object({
    access_token: z.string().min(1),
    expires_in: z.number().int().positive(),
    token_type: z.string().min(1),
});
export const OAuthTokenCacheSchema = z.object({
    accessToken: z.string().min(1),
    expiresAt: z.number().int().positive(),
    tokenType: z.string().min(1),
});
