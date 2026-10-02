"use client";

/**
 * AI support assistant chat.
 * Messages go to /api/ai/chat, which grounds answers in the ERP knowledge base
 * and uses the language model only when a provider key is configured. Each
 * answer shows where it came from so users know how much to trust it.
 */

import React, { useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataSlotPulse, PageContentWrapper, PageSectionHeader } from "@/components/shared";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AssistantChatSource } from "@/types";

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: AssistantChatSource;
  matchedQuestion?: string;
};

const SUGGESTIONS = [
  "How do I create a new export order?",
  "What happens to stock when an order is approved?",
  "Why is a performance entry in the wrong month?",
  "How do I receive a purchase order?",
];

const SOURCE_LABELS: Record<AssistantChatSource, string> = {
  model: "Model + knowledge base",
  knowledge: "Knowledge base",
  fallback: "Knowledge base (offline mode)",
};

export default function AdminAssistantContent() {
  const [sessionId] = useState(
    () => `web-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const node = scrollRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isSending) return;

    setEntries((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: message },
    ]);
    setInput("");
    setIsSending(true);
    scrollToBottom();

    try {
      const response = await apiClient.ai.chat({ message, sessionId });
      const data = response.data;
      setEntries((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          source: data.source,
          matchedQuestion: data.matched[0]?.question,
        },
      ]);
    } catch {
      setEntries((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "Something went wrong answering that question. Please try again.",
          source: "fallback",
        },
      ]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h2"
          icon={Sparkles}
          tone="teal"
          title="AI Assistant"
          description="ERP support questions answered from the knowledge base, with the language model when configured."
        />

        <div className="rounded-[28px] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md flex flex-col overflow-hidden">
          {/* Conversation */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-[380px] max-h-[56vh] overflow-y-auto p-4 space-y-3"
          >
            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                <div className="p-3 rounded-2xl border border-teal-400/30 bg-teal-500/10">
                  <Bot className="h-6 w-6 text-teal-600 dark:text-teal-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">
                  Ask about orders, approvals, inventory, purchasing, finance,
                  or shipping. Answers come from the ERP knowledge base.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-700 dark:text-teal-300 hover:bg-teal-500/20"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex gap-2",
                  entry.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {entry.role === "assistant" && (
                  <div className="mt-1 h-7 w-7 shrink-0 rounded-full border border-teal-400/30 bg-teal-500/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl border px-3.5 py-2.5 text-sm",
                    entry.role === "user"
                      ? "border-violet-400/30 bg-violet-500/10 text-gray-700 dark:text-white"
                      : "border-teal-400/20 bg-white/70 dark:bg-white/10 text-gray-700 dark:text-gray-100",
                  )}
                >
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                  {entry.role === "assistant" && entry.source && (
                    <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      Source: {SOURCE_LABELS[entry.source]}
                      {entry.matchedQuestion
                        ? ` · matched: ${entry.matchedQuestion}`
                        : ""}
                    </p>
                  )}
                </div>
                {entry.role === "user" && (
                  <div className="mt-1 h-7 w-7 shrink-0 rounded-full border border-violet-400/30 bg-violet-500/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 pl-9">
                <DataSlotPulse variant="text-sm" className="w-48" />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/20 dark:border-white/10 p-3 flex items-center gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Skip Enter while an IME candidate window is composing text.
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about orders, stock, purchasing, finance…"
              className="h-11 rounded-xl"
              disabled={isSending}
            />
            <Button
              onClick={() => void send(input)}
              disabled={isSending || !input.trim()}
              className="h-11 rounded-xl border border-teal-400/30 bg-gradient-to-r from-teal-500/40 via-teal-500/30 to-teal-500/20 text-white"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </PageContentWrapper>
  );
}