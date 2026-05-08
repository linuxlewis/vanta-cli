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

export const DocumentStatusSchema = z.enum([
  "Needs document",
  "Needs update",
  "Not relevant",
  "OK",
]);

export const ControlOwnerSchema = z
  .object({
    id: z.string(),
    emailAddress: z.string().nullable().optional(),
    displayName: z.string().nullable().optional(),
  })
  .passthrough();

export const VantaControlSchema = z
  .object({
    id: z.string(),
    externalId: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    domains: z.array(z.string()).optional(),
    owner: ControlOwnerSchema.nullable().optional(),
  })
  .passthrough();

export const ListControlsResponseSchema = z.object({
  results: z.object({
    pageInfo: PageInfoSchema.optional(),
    data: z.array(VantaControlSchema),
  }),
});

export const SetControlOwnerRequestSchema = z.object({
  userId: z.string().min(1),
});

export const VantaDocumentSchema = z
  .object({
    id: z.string(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    isSensitive: z.boolean().optional(),
    ownerId: z.string().nullable().optional(),
    overallStatus: DocumentStatusSchema.or(z.string()).optional(),
    uploadStatusDate: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .passthrough();

export const ListDocumentsResponseSchema = z.object({
  results: z.object({
    pageInfo: PageInfoSchema.optional(),
    data: z.array(VantaDocumentSchema),
  }),
});

export const UploadDocumentFileResponseSchema = z
  .object({
    id: z.string(),
    creationDate: z.string().nullable().optional(),
    updatedDate: z.string().nullable().optional(),
    deletionDate: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    effectiveDate: z.string().nullable().optional(),
    fileName: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    mimeType: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    uploadedByUserId: z.string().nullable().optional(),
  })
  .passthrough();

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

export type TestStatus = z.infer<typeof TestStatusSchema>;
export type TestCategory = z.infer<typeof TestCategorySchema>;
export type EntityStatus = z.infer<typeof EntityStatusSchema>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type VantaTest = z.infer<typeof VantaTestSchema>;
export type VantaTestEntity = z.infer<typeof VantaTestEntitySchema>;
export type ListTestsResponse = z.infer<typeof ListTestsResponseSchema>;
export type ListTestEntitiesResponse = z.infer<
  typeof ListTestEntitiesResponseSchema
>;
export type DeactivateTestEntityRequest = z.infer<
  typeof DeactivateTestEntityRequestSchema
>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type ControlOwner = z.infer<typeof ControlOwnerSchema>;
export type VantaControl = z.infer<typeof VantaControlSchema>;
export type ListControlsResponse = z.infer<typeof ListControlsResponseSchema>;
export type SetControlOwnerRequest = z.infer<
  typeof SetControlOwnerRequestSchema
>;
export type VantaDocument = z.infer<typeof VantaDocumentSchema>;
export type ListDocumentsResponse = z.infer<typeof ListDocumentsResponseSchema>;
export type UploadDocumentFileResponse = z.infer<
  typeof UploadDocumentFileResponseSchema
>;
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
export type OAuthTokenCache = z.infer<typeof OAuthTokenCacheSchema>;
