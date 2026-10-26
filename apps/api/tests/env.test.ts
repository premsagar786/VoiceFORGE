import { describe, expect, it } from "vitest";
import { envWarnings, getFeatures, validateEnv } from "../src/env.js";

const baseEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://u:p@localhost:5433/voiceforge",
  SESSION_SECRET: "s".repeat(32),
  ENCRYPTION_KEY: "k".repeat(32),
};

describe("validateEnv", () => {
  it("accepts a minimal valid env and applies defaults", () => {
    const env = validateEnv(baseEnv);
    expect(env.PORT).toBe(4000);
    expect(env.RATE_LIMIT_PER_MIN).toBe(30);
    expect(env.MAX_CALL_SECONDS).toBe(300);
    expect(env.MONTHLY_BUDGET_INR).toBe(500);
    expect(env.LLM_PROVIDER).toBe("openai");
    expect(env.EMBEDDING_MODEL).toBe("text-embedding-3-small");
    expect(env.corsOrigins).toEqual(["http://localhost:3000"]);
    expect(env.HUMAN_TRANSFER_NUMBER).toBe("");
  });

  it("fails with a readable message when DATABASE_URL is missing", () => {
    expect(() => validateEnv({ ...baseEnv, DATABASE_URL: undefined })).toThrowError(/DATABASE_URL/);
  });

  it("fails when SESSION_SECRET is too short", () => {
    expect(() => validateEnv({ ...baseEnv, SESSION_SECRET: "short" })).toThrowError(
      /SESSION_SECRET/,
    );
  });

  it("parses CORS_ORIGINS as a list", () => {
    const env = validateEnv({ ...baseEnv, CORS_ORIGINS: "http://a.com, http://b.com," });
    expect(env.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
  });

  it("rejects empty CORS_ORIGINS", () => {
    expect(() => validateEnv({ ...baseEnv, CORS_ORIGINS: " , " })).toThrowError(/CORS_ORIGINS/);
  });

  it("requires deployed URLs in production", () => {
    expect(() =>
      validateEnv({ ...baseEnv, NODE_ENV: "production", APP_URL: "http://localhost:3000" }),
    ).toThrowError(/APP_URL/);
  });

  it("coerces numeric strings", () => {
    const env = validateEnv({ ...baseEnv, RATE_LIMIT_PER_MIN: "42", PORT: "4001" });
    expect(env.RATE_LIMIT_PER_MIN).toBe(42);
    expect(env.PORT).toBe(4001);
  });
});

describe("getFeatures", () => {
  it("reports voice/llm/calendar unavailable without keys", () => {
    const features = getFeatures(validateEnv(baseEnv));
    expect(features).toEqual({ voice: false, llm: false, calendar: false });
  });

  it("reports llm available for the configured provider", () => {
    const features = getFeatures(
      validateEnv({ ...baseEnv, ANTHROPIC_API_KEY: "sk-ant-x" }),
    );
    // provider defaults to openai, so an anthropic key alone is not enough
    expect(features.llm).toBe(false);
    const features2 = getFeatures(
      validateEnv({ ...baseEnv, LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-ant-x" }),
    );
    expect(features2.llm).toBe(true);
  });
});

describe("envWarnings", () => {
  it("warns about missing voice, llm, calendar and transfer number", () => {
    const warnings = envWarnings(validateEnv(baseEnv));
    expect(warnings.some((w) => w.includes("ELEVENLABS_API_KEY"))).toBe(true);
    expect(warnings.some((w) => w.includes("LLM_PROVIDER"))).toBe(true);
    expect(warnings.some((w) => w.includes("GOOGLE_CLIENT_ID"))).toBe(true);
    expect(warnings.some((w) => w.includes("HUMAN_TRANSFER_NUMBER"))).toBe(true);
  });

  it("stays quiet when everything is configured", () => {
    const warnings = envWarnings(
      validateEnv({
        ...baseEnv,
        ELEVENLABS_API_KEY: "el-x",
        ELEVENLABS_WEBHOOK_SECRET: "wh-x",
        LLM_PROVIDER: "openai",
        OPENAI_API_KEY: "sk-x",
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret",
        GOOGLE_REDIRECT_URI: "https://app.example.com/api/oauth/google/callback",
        HUMAN_TRANSFER_NUMBER: "+919876543210",
      }),
    );
    expect(warnings).toEqual([]);
  });
});
