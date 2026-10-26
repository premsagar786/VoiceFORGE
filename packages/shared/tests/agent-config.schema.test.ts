import { describe, expect, it } from "vitest";
import { AgentConfigSchema } from "../src/agent-config.schema.js";

const validConfig = {
  name: "Test Agent",
  persona: { role: "receptionist", tone: "friendly" },
  voice: { voiceId: "voice-123" },
};

describe("AgentConfigSchema", () => {
  it("fills defaults for omitted optional fields", () => {
    const config = AgentConfigSchema.parse(validConfig);
    expect(config.goals).toEqual([]);
    expect(config.languages).toEqual(["en"]);
    expect(config.maxCallSeconds).toBe(300);
    expect(config.guardrails.do).toEqual([]);
    expect(config.tools).toEqual([]);
  });

  it("rejects a config without a voice", () => {
    expect(() =>
      AgentConfigSchema.parse({ name: "X", persona: { role: "r", tone: "t" } }),
    ).toThrowError();
  });

  it("rejects an unknown tool", () => {
    expect(() =>
      AgentConfigSchema.parse({ ...validConfig, tools: ["make_coffee"] }),
    ).toThrowError();
  });
});
