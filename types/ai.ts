/**
 * AI support assistant types
 */

export type AssistantChatSource = "model" | "knowledge" | "fallback";

export type AssistantChatResponse = {
  sessionId: string;
  answer: string;
  /** Where the answer came from: model, knowledge base, or offline fallback */
  source: AssistantChatSource;
  /** Model provider when the model answered */
  provider: string | null;
  /** Knowledge articles matched to the question */
  matched: Array<{
    id: string;
    question: string;
    category: string;
    score: number;
  }>;
};