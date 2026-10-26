import { z } from "zod";

/**
 * Refinement patch — returned by the LLM for POST /api/agents/:id/refine
 * (feature spec #5). Keys are dotted field paths into AgentConfig,
 * e.g. "persona.tone" or "firstMessage".
 */
export const RefinePatchSchema = z.object({
  changes: z.record(z.string().min(1), z.unknown()),
  summary: z.string().min(1).max(500),
});
export type RefinePatch = z.infer<typeof RefinePatchSchema>;
