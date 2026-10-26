import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

/**
 * Zod-validated environment. Boot fails fast with a readable message when a
 * core variable is missing or malformed. Voice / LLM / calendar / demo vars
 * are tiered: validated when present, feature-gated when absent (see
 * `getFeatures`), because the calendar tool is optional by design and voice
 * keys may legitimately not exist yet in local dev.
 */

// Walk up from cwd so `pnpm dev` (repo root), `--filter api` (apps/api) and
// prisma CLI (prisma/) invocations all find the same .env file.
function findEnvPath(): string | undefined {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

dotenvConfig({ path: findEnvPath() });

const CoreEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
  ENCRYPTION_KEY: z.string().min(32, "must be at least 32 characters"),
  DATABASE_URL: z.string().min(1, "is required"),
});

const VoiceEnvSchema = z.object({
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_WEBHOOK_SECRET: z.string().min(1).optional(),
  ELEVENLABS_DEFAULT_VOICE_ID: z.string().min(1).optional(),
  ELEVENLABS_DEFAULT_MODEL_ID: z.string().min(1).optional(),
});

const LlmEnvSchema = z.object({
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Defaults verified against provider docs in Step 3 (rule: never guess model names).
  LLM_MODEL_GENERATE: z.string().default("gpt-4o-mini"),
  LLM_MODEL_SUMMARY: z.string().default("gpt-4o-mini"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
});

const CalendarEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
});

const DemoEnvSchema = z.object({
  HUMAN_TRANSFER_NUMBER: z.string().default(""),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
  MAX_CALL_SECONDS: z.coerce.number().int().positive().default(300),
  MONTHLY_BUDGET_INR: z.coerce.number().nonnegative().default(500),
});

const OptionalEnvSchema = z.object({
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("./uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  TELEPHONY_PROVIDER: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  WEBHOOK_SIGNING_SECRET: z.string().optional(),
});

export const EnvSchema = z
  .object({
    ...CoreEnvSchema.shape,
    ...VoiceEnvSchema.shape,
    ...LlmEnvSchema.shape,
    ...CalendarEnvSchema.shape,
    ...DemoEnvSchema.shape,
    ...OptionalEnvSchema.shape,
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production") {
      const localhostDefaults: Array<[string, string]> = [
        ["APP_URL", "http://localhost:3000"],
        ["API_URL", "http://localhost:4000"],
        ["NEXT_PUBLIC_API_URL", "http://localhost:4000"],
      ];
      for (const [key, devDefault] of localhostDefaults) {
        if (val[key as keyof typeof val] === devDefault) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} must be set to the deployed URL in production`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof EnvSchema> & { corsOrigins: string[] };

/** Pure function — safe to call in tests with a synthetic record. */
export function validateEnv(source: NodeJS.ProcessEnv): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables — ${details}`);
  }
  const corsOrigins = parsed.data.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    throw new Error("Invalid environment variables — CORS_ORIGINS: must list at least one origin");
  }
  return { ...parsed.data, corsOrigins };
}

/** Feature availability based on which API keys are configured. */
export function getFeatures(env: Env) {
  const llm =
    env.LLM_PROVIDER === "openai" ? Boolean(env.OPENAI_API_KEY) : Boolean(env.ANTHROPIC_API_KEY);
  return {
    voice: Boolean(env.ELEVENLABS_API_KEY),
    llm,
    calendar: Boolean(
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI,
    ),
  };
}

/** Human-readable warnings for configured-but-incomplete feature setups. */
export function envWarnings(env: Env): string[] {
  const warnings: string[] = [];
  if (!getFeatures(env).voice) {
    warnings.push(
      "Voice features disabled: set ELEVENLABS_API_KEY (plus ELEVENLABS_DEFAULT_VOICE_ID / ELEVENLABS_DEFAULT_MODEL_ID) to enable.",
    );
  }
  if (!getFeatures(env).llm) {
    warnings.push(
      `Generation/refinement disabled: LLM_PROVIDER is "${env.LLM_PROVIDER}" but the matching API key is not set.`,
    );
  }
  if (!getFeatures(env).calendar) {
    warnings.push(
      "Calendar tools will show as not connected: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI to enable.",
    );
  }
  if (!env.ELEVENLABS_WEBHOOK_SECRET) {
    warnings.push("Webhook signature verification cannot pass: set ELEVENLABS_WEBHOOK_SECRET.");
  }
  if (!env.HUMAN_TRANSFER_NUMBER) {
    warnings.push("transfer_to_human has no number: set HUMAN_TRANSFER_NUMBER for the demo.");
  }
  return warnings;
}

let cached: Env | undefined;

/** Memoized singleton used by server code. Throws on first call if env is invalid. */
export function getEnv(): Env {
  cached ??= validateEnv(process.env);
  return cached;
}
