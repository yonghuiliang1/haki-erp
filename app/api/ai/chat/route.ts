/**
 * AI Support Assistant chat endpoint.
 * Retrieval-augmented: knowledge matches ground the answer; when an LLM key is
 * configured the model phrases it, otherwise the best article is returned
 * directly. Every exchange is logged to ChatMessage so answers stay traceable.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { prisma } from "@/prisma/client";
import { aiChatBodySchema } from "@/lib/validations/ai";
import {
  retrieveKnowledge,
  type KnowledgeMatch,
} from "@/lib/ai/knowledge-retrieval";
import { createChatCompletion, isLlmConfigured } from "@/lib/ai";

const NOT_FOUND_ANSWER =
  "I could not find this in the ERP knowledge base yet. Try rephrasing, or ask about orders, approvals, inventory, purchasing, finance, or shipping.";

/** Same message for Chinese questions so the UI language stays consistent. */
const NOT_FOUND_ANSWER_ZH =
  "知识库里暂时没有找到相关内容。可以换个说法，或者试试订单、审批、库存、采购、财务、物流相关的问题。";

const SYSTEM_PROMPT = `You are the HAKI ERP support assistant. Answer questions about the export trade ERP using ONLY the knowledge base context provided below. If the context does not cover the question, say you could not find it in the knowledge base and suggest asking about orders, approvals, inventory, purchasing, finance, or shipping. Reply in the language of the user's question. Keep answers short, concrete, and free of markdown.`;

/** Grounded answer used when no model key is configured or the model fails. */
function knowledgeAnswer(matches: KnowledgeMatch[], chineseQuestion: boolean): string {
  const best = matches[0];
  if (best) return best.answer;
  return chineseQuestion ? NOT_FOUND_ANSWER_ZH : NOT_FOUND_ANSWER;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The assistant is an internal operator tool; external portals have their own support.
    const allowed = ["admin", "sales", "finance", "warehouse", "purchase"];
    if (!allowed.includes(session.role ?? "")) {
      return NextResponse.json(
        { error: "You are not allowed to use the support assistant" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = aiChatBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { message } = validationResult.data;
    const sessionId =
      validationResult.data.sessionId ?? `chat-${session.id}-${Date.now()}`;

    const matches = await retrieveKnowledge(message);

    let answer = knowledgeAnswer(matches, /[\u4e00-\u9fff]/.test(message));
    let source: "model" | "knowledge" | "fallback" =
      matches.length > 0 ? "knowledge" : "fallback";
    let provider: string | undefined;

    if (isLlmConfigured()) {
      // Recent thread history keeps follow-up questions coherent.
      const history = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { role: true, content: true },
      });

      const context =
        matches.length > 0
          ? matches
              .map((match, index) => `[${index + 1}] Q: ${match.question}\nA: ${match.answer}`)
              .join("\n\n")
          : "No matching knowledge articles were found.";

      const completion = await createChatCompletion(
        [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nKnowledge base context:\n${context}` },
          ...history.reverse().map((entry) => ({
            role: entry.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: entry.content,
          })),
          { role: "user", content: message },
        ],
        { max_tokens: 400, temperature: 0.3 },
      );

      if (completion.ok) {
        const content = completion.data.choices[0]?.message?.content?.trim();
        if (content) {
          answer = content;
          source = "model";
          provider = completion.provider;
        }
      } else {
        // Model unavailable (billing/rate limit/upstream) — stay useful offline.
        logger.warn("Assistant model call failed, serving knowledge answer", {
          kind: completion.kind,
        });
        source = "fallback";
      }
    }

    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { sessionId, userId: session.id, role: "user", content: message },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId,
          userId: session.id,
          role: "assistant",
          content: answer,
          source,
        },
      }),
    ]);

    // Track which articles actually get used.
    const bestMatch = matches[0];
    if (bestMatch) {
      prisma.knowledgeArticle
        .update({
          where: { id: bestMatch.id },
          data: { hitCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      sessionId,
      answer,
      source,
      provider: provider ?? null,
      matched: matches.map((match) => ({
        id: match.id,
        question: match.question,
        category: match.category,
        score: match.score,
      })),
    });
  } catch (error) {
    logger.error("Error in assistant chat:", error);
    return NextResponse.json(
      { error: "Failed to answer the question" },
      { status: 500 },
    );
  }
}