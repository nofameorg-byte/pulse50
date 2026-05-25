"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type OrivooMessage = {
  id: number | string;
  question: string;
  answer: string;
};

function OrivooSidebar() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<OrivooMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let savedSessionId = localStorage.getItem("orivoo_session_id");

    if (!savedSessionId) {
      savedSessionId = crypto.randomUUID();
      localStorage.setItem("orivoo_session_id", savedSessionId);
    }

    setSessionId(savedSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    async function loadHistory() {
      setHistoryLoading(true);

      try {
        const res = await fetch("/api/orivoo/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (Array.isArray(data?.messages)) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("ORIVOO history load error:", error);
      }

      setHistoryLoading(false);
    }

    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    if (!open) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, historyLoading, open]);

  async function askOrivoo() {
    const currentQuestion = message.trim();
    if (!currentQuestion || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/orivoo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentQuestion,
          history: messages.slice(0, 10),
          sessionId,
        }),
      });

      const data = await res.json();

      const newMessage = {
        id: Date.now(),
        question: currentQuestion,
        answer: data.reply || "ORIVOO could not answer right now.",
      };

      setMessages((prev) => [newMessage, ...prev]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        {
          id: Date.now(),
          question: currentQuestion,
          answer: "Something went wrong with ORIVOO.",
        },
        ...prev,
      ]);
    }

    setLoading(false);
  }

  function deleteMessage(id: number | string) {
    setMessages((prev) => prev.filter((item) => item.id !== id));
  }

  const orderedMessages = [...messages].reverse();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 transition-transform hover:scale-110"
      >
        <Image
          src="/orivoo-logo.png"
          alt="ORIVOO"
          width={95}
          height={95}
          priority
          loading="eager"
          style={{ width: "auto", height: "auto" }}
          className="drop-shadow-[0_0_25px_rgba(255,215,0,0.9)]"
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60">
          <div className="fixed right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-yellow-500/40 bg-black text-white shadow-2xl">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/orivoo-logo.png"
                    alt="ORIVOO"
                    width={75}
                    height={75}
                    priority
                    loading="eager"
                    style={{ width: "auto", height: "auto" }}
                    className="drop-shadow-[0_0_20px_rgba(255,215,0,0.9)]"
                  />

                  <div>
                    <h2 className="text-2xl font-bold text-yellow-400">
                      ORIVOO
                    </h2>

                    <p className="text-sm text-zinc-400">
                      Pulse50 civic intelligence
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {historyLoading ? (
                <div className="rounded-xl border border-yellow-500/20 bg-zinc-950 p-4 text-sm text-yellow-300">
                  Loading ORIVOO memory...
                </div>
              ) : orderedMessages.length === 0 ? (
                <div className="rounded-xl border border-yellow-500/20 bg-zinc-950 p-4 text-sm text-zinc-400">
                  Ask ORIVOO about a bill, law, official, hearing, history,
                  candidate, or civic issue.
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedMessages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 opacity-90"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => deleteMessage(item.id)}
                          title="Hide this question"
                          className="mt-1 h-5 w-5 shrink-0 rounded border border-yellow-400/70 hover:bg-yellow-400"
                        />

                        <div className="rounded-lg border border-yellow-500/20 bg-black/60 p-3 text-sm text-yellow-100">
                          <span className="font-bold text-yellow-400">
                            You asked:
                          </span>{" "}
                          {item.question}
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <h3 className="mb-2 font-bold text-yellow-400">
                          ORIVOO Response
                        </h3>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-100">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="mt-4 rounded-xl border border-yellow-500/20 bg-zinc-950 p-4 text-sm text-yellow-300">
                  ORIVOO is thinking...
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-zinc-800 bg-black p-5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  loading
                    ? "ORIVOO is thinking..."
                    : "Ask another question..."
                }
                disabled={loading}
                className="h-28 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-white outline-none disabled:opacity-60"
              />

              <button
                type="button"
                onClick={askOrivoo}
                disabled={loading || !message.trim()}
                className="mt-4 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                {loading ? "ORIVOO is thinking..." : "Ask ORIVOO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrivooSidebar;