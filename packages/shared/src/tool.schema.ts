import { z } from "zod";
import { AGENT_TOOLS } from "./agent-config.schema.js";

/** Tool names the voice agent can call, executed via our webhook (feature spec #7). */
export const ToolNameSchema = z.enum(AGENT_TOOLS);
export type ToolName = z.infer<typeof ToolNameSchema>;

export const ToolInvocationStatusSchema = z.enum(["ok", "error", "timeout"]);
export type ToolInvocationStatus = z.infer<typeof ToolInvocationStatusSchema>;

/** Shape of the payload our tool webhook returns to the voice provider. */
export const ToolResultSchema = z.object({
  ok: z.boolean(),
  // Free-form result consumed by the agent's LLM. Kept loose on purpose.
  data: z.unknown().optional(),
  error: z.string().optional(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;
