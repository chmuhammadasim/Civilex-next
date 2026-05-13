"use client";

import { useState, useRef, useEffect } from "react";
import { Scale, X, Send, Trash2, ChevronDown, BookOpen } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "What are the grounds for divorce (talaq) in Islam?",
  "How does inheritance work under Islamic law in Pakistan?",
  "What is the procedure to file an FIR?",
  "Explain bail provisions under CrPC",
  "What are the rights of a wife regarding mahr?",
  "How is khul' (wife-initiated divorce) different from talaq?",
];

export default function LawChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnread(0);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/law-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.ok
          ? data.response
          : data.error || "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!isOpen) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        title="Open Law Assistant"
        aria-label="Open Law Assistant"
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <Scale className="h-6 w-6" />
        )}
        {!isOpen && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex w-95 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Mizan — Law Assistant</p>
                <p className="text-xs text-white/70">Islamic & Pakistani Law · References included</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex h-105 flex-col overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <p className="mb-1 text-sm font-semibold text-foreground">
                  Ask about Islamic or Pakistani Law
                </p>
                <p className="mb-4 text-xs text-muted">
                  I cite Quran, Hadith, and Pakistan statutes in every answer.
                </p>
                <div className="w-full space-y-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full rounded-lg border border-border bg-cream-light px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {msg.role === "user" ? "U" : "M"}
                    </div>
                    <div
                      className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "border border-border bg-cream-light text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          msg.role === "user" ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString("en-PK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      M
                    </div>
                    <div className="rounded-xl border border-border bg-cream-light px-3 py-2">
                      <div className="flex gap-1 py-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Pakistani or Islamic law…"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-cream-light px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-opacity disabled:opacity-40"
                title="Send"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted">
              Covers Quran, Sunnah, PPC, CPC, CrPC, Family Laws & more
            </p>
          </div>
        </div>
      )}
    </>
  );
}
