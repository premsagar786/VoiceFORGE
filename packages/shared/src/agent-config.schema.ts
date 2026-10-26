import { z } from "zod";

/**
 * AgentConfig — the single source of truth for a voice agent's setup.
 * Shared by the API (validation + persistence), the web editor (forms),
 * and the LLM prompts (generation + refinement).
 *
 * Reconstructed from build-prompt feature specs #1/#2/#5 (PRD Section 10 unavailable).
 */

export const AGENT_TOOLS = [
  "knowledge_search",
  "check_calendar",
  "book_slot",
  "transfer_to_human",
] as const;
export type AgentTool = (typeof AGENT_TOOLS)[number];

export const AGENT_LANGUAGES = ["en", "hi"] as const;
export type AgentLanguage = (typeof AGENT_LANGUAGES)[number];

export const AGENT_STATUSES = ["draft", "live", "paused"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const ConversationFlowStepSchema = z.object({
  id: z.string().min(1).max(40),
  step: z.string().min(1).max(300),
});
export type ConversationFlowStep = z.infer<typeof ConversationFlowStepSchema>;

export const GuardrailsSchema = z.object({
  do: z.array(z.string().min(1).max(300)).max(10).default([]),
  dont: z.array(z.string().min(1).max(300)).max(10).default([]),
});

export const VoiceSchema = z.object({
  voiceId: z.string().min(1).max(64),
  name: z.string().max(80).optional(),
});

export const AgentConfigSchema = z.object({
  name: z.string().min(1).max(80),
  persona: z.object({
    role: z.string().min(1).max(400),
    tone: z.string().min(1).max(200),
  }),
  goals: z.array(z.string().min(1).max(300)).max(10).default([]),
  conversationFlow: z.array(ConversationFlowStepSchema).max(15).default([]),
  firstMessage: z.string().max(500).default(""),
  guardrails: GuardrailsSchema.default({ do: [], dont: [] }),
  languages: z.array(z.enum(AGENT_LANGUAGES)).min(1).max(2).default(["en"]),
  voice: VoiceSchema,
  tools: z.array(z.enum(AGENT_TOOLS)).max(AGENT_TOOLS.length).default([]),
  escalationRule: z.string().max(500).default(""),
  maxCallSeconds: z.number().int().min(30).max(1800).default(300),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/** Outcome tags assigned after every call (feature spec #9). */
export const OUTCOME_TAGS = [
  "booked",
  "answered",
  "transferred",
  "unresolved",
  "abandoned",
] as const;
export type OutcomeTag = (typeof OUTCOME_TAGS)[number];

/** Post-call flags (feature spec #9). */
export const CONVERSATION_FLAGS = [
  "angry_caller",
  "agent_failed",
  "high_latency",
  "tool_error",
] as const;
export type ConversationFlag = (typeof CONVERSATION_FLAGS)[number];
