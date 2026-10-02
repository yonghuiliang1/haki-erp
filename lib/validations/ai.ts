/**
 * AI API validation schemas
 */

import { z } from "zod";

export const aiInsightsBodySchema = z.object({
  summary: z.string().trim().min(1, "Summary is required"),
});

export type AiInsightsBody = z.infer<typeof aiInsightsBodySchema>;

/** Support assistant chat request */
export const aiChatBodySchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  sessionId: z.string().min(1).max(80).optional(),
});

export type AiChatBody = z.infer<typeof aiChatBodySchema>;
