"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { reviewApi } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface Props {
  reviewId: string;
  open: boolean;
  onClose: () => void;
}

export function ReviewChatPanel({ reviewId, open, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const isLoadingOlderRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!open) return;
    isFirstLoadRef.current = true;
    reviewApi
      .getChatHistory(reviewId)
      .then((data) => {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      })
      .catch(() => toast.error("Failed to load chat history"))
      .finally(() => setLoaded(true));
  }, [open, reviewId]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    isLoadingOlderRef.current = true;

    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const data = await reviewApi.getChatHistory(reviewId, nextCursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      });
    } catch {
      toast.error("Failed to load older messages");
      isLoadingOlderRef.current = false;
    } finally {
      setLoadingOlder(false);
    }
  }, [reviewId, hasMore, nextCursor, loadingOlder]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !open) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlder();
      },
      { root: scrollRef.current, threshold: 1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, loadOlder]);

  useEffect(() => {
    if (isLoadingOlderRef.current) {
      isLoadingOlderRef.current = false;
      return;
    }
    const behavior: ScrollBehavior = isFirstLoadRef.current ? "auto" : "smooth";
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
    isFirstLoadRef.current = false;
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setSending(true);

    try {
      const data = await reviewApi.sendChatMessage(reviewId, trimmed);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        { ...optimisticUserMsg, id: `user-${data.message.id}` },
        data.message,
      ]);
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-96 bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark flex flex-col p-0"
      >
        <SheetHeader className="h-14 shrink-0 flex-row items-center px-4 border-b border-gray-100 dark:border-border-dark space-y-0">
          <MessageSquare
            size={16}
            className="text-blue-600 dark:text-blue-400 mr-2"
          />
          <SheetTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Ask about this review
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {hasMore && <div ref={topSentinelRef} className="h-1" />}
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <Loader2 size={14} className="animate-spin text-gray-400" />
            </div>
          )}

          {!loaded ? (
            <div className="flex justify-center py-2">
              <Loader2 size={14} className="animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Ask why an issue matters, how to fix it, or anything else about
              this review.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "USER"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-surface-dark text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-surface-dark rounded-lg px-3 py-2">
                <Loader2 size={14} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-border-dark">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleSend())
              }
              placeholder="Ask about an issue..."
              maxLength={2000}
              disabled={sending}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
