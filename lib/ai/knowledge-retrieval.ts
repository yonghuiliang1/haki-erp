/**
 * Knowledge-base retrieval for the AI support assistant.
 * Keyword overlap scoring with CJK bigrams so both English and Chinese
 * questions match; no external search service is needed at this scale.
 */

import { prisma } from "@/prisma/client";

export type KnowledgeMatch = {
  id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "how",
  "do",
  "does",
  "i",
  "to",
  "for",
  "of",
  "in",
  "on",
  "and",
  "or",
  "my",
  "can",
  "what",
  "where",
  "when",
  "why",
  "it",
  "this",
  "that",
  "with",
  "be",
  "should",
  "you",
  "your",
]);

/** Split into lowercase word tokens plus CJK bigrams. */
function tokenize(text: string): string[] {
  const lowered = text.toLowerCase();
  const tokens = lowered
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  const cjkRuns = lowered.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const run of cjkRuns) {
    for (let i = 0; i < run.length - 1; i += 1) {
      tokens.push(run.slice(i, i + 2));
    }
  }
  return tokens;
}

/** Count how many distinct tokens of `text` appear in the question. */
function overlapScore(questionTokens: Set<string>, text: string): number {
  let hits = 0;
  for (const token of new Set(tokenize(text))) {
    if (questionTokens.has(token)) hits += 1;
  }
  return hits;
}

/**
 * Best knowledge articles for a question, highest score first.
 * Empty when nothing overlaps — callers decide how to say "not found".
 */
export async function retrieveKnowledge(
  question: string,
  limit = 3,
): Promise<KnowledgeMatch[]> {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { status: true },
  });
  if (articles.length === 0) return [];

  const questionTokens = new Set(tokenize(question));

  return articles
    .map((article) => {
      const questionHits = overlapScore(questionTokens, article.question) * 2;
      const keywordHits = article.keywords
        ? overlapScore(questionTokens, article.keywords.replace(/,/g, " ")) * 1.5
        : 0;
      const answerHits = overlapScore(questionTokens, article.answer) * 0.5;
      return {
        id: article.id,
        question: article.question,
        answer: article.answer,
        category: article.category,
        score: questionHits + keywordHits + answerHits,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}