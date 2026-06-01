"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type OrivooMessage = {
  id: number | string;
  question: string;
  answer: string;
};

function OrivooSidebar() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<OrivooMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const historyReadyRef = useRef(false);

  function getMessagesStorageKey(currentUserId: string) {
    return `orivoo_messages_${currentUserId}`;
  }

  function getDeletedStorageKey(currentUserId: string) {
    return `orivoo_deleted_messages_${currentUserId}`;
  }

  function getDeletedMessageIds(currentUserId: string) {
    if (!currentUserId) return [];

    const deletedKey = getDeletedStorageKey(currentUserId);
    const savedDeleted = localStorage.getItem(deletedKey);

    if (!savedDeleted) return [];

    try {
      const parsed = JSON.parse(savedDeleted);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      console.error("Could not restore deleted ORIVOO message ids");
    }

    return [];
  }

  function filterDeletedMessages(
    incomingMessages: OrivooMessage[],
    currentUserId: string
  ) {
    const deletedIds = getDeletedMessageIds(currentUserId);

    return incomingMessages.filter(
      (item) => !deletedIds.includes(String(item.id))
    );
  }

  useEffect(() => {
    async function setupSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentUserId = user?.id || "";
      const currentUserEmail = user?.email || "";

      setUserId(currentUserId);
      setUserEmail(currentUserEmail);

      if (!currentUserId) {
        historyReadyRef.current = false;
        setOpen(false);
        setSessionId("");
        setMessages([]);
        return;
      }

      const sessionKey = `orivoo_session_id_${currentUserId}`;

      let savedSessionId = localStorage.getItem(sessionKey);

      if (!savedSessionId) {
        savedSessionId = crypto.randomUUID();
        localStorage.setItem(sessionKey, savedSessionId);
      }

      historyReadyRef.current = false;
      setSessionId(savedSessionId);
    }

    setupSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setupSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const storageKey = getMessagesStorageKey(userId);

    async function loadHistory() {
      historyReadyRef.current = false;
      setHistoryLoading(true);

      const savedMessages = localStorage.getItem(storageKey);
      let restoredFromLocal = false;

      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);

          if (Array.isArray(parsed)) {
            const filteredLocalMessages = filterDeletedMessages(parsed, userId);
            setMessages(filteredLocalMessages);
            restoredFromLocal = true;
          }
        } catch {
          console.error("Could not restore ORIVOO messages");
        }
      }

      if (!restoredFromLocal) {
        setMessages([]);
      }

      try {
        const res = await fetch("/api/orivoo/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            userId,
          }),
        });

        const data = await res.json();

        if (Array.isArray(data?.messages) && data.messages.length > 0) {
          const filteredServerMessages = filterDeletedMessages(
            data.messages,
            userId
          );

          setMessages(filteredServerMessages);

          localStorage.setItem(
            storageKey,
            JSON.stringify(filteredServerMessages)
          );
        }
      } catch (error) {
        console.error("ORIVOO history load error:", error);
      }

      historyReadyRef.current = true;
      setHistoryLoading(false);
    }

    loadHistory();
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;
    if (!historyReadyRef.current) return;

    const storageKey = getMessagesStorageKey(userId);

    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, userId, sessionId]);

  useEffect(() => {
    if (!open) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, historyLoading, open]);

useEffect(() => {
  if (!open) return;

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = originalOverflow;
  };
}, [open]);

  function handleLauncherClick() {
    if (!userId) {
      router.push("/login");
      return;
    }

    setOpen(true);
  }

  async function askOrivoo() {
    const currentQuestion = message.trim();
    if (!currentQuestion || loading || !userId) return;

    const pendingId = Date.now();

    const pendingMessage = {
      id: pendingId,
      question: currentQuestion,
      answer: "ORIVOO is thinking...",
    };

    setLoading(true);
    setMessage("");
    setMessages((prev) => [pendingMessage, ...prev]);

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
          userId,
        }),
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? {
                ...item,
                answer: data.reply || "ORIVOO could not answer right now.",
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setMessages((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? {
                ...item,
                answer: "Something went wrong with ORIVOO.",
              }
            : item
        )
      );
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();

    historyReadyRef.current = false;

    setOpen(false);
    setUserId("");
    setUserEmail("");
    setMessages([]);
    setMessage("");
    setSessionId("");

    router.push("/");
  }

  function deleteMessage(id: number | string) {
    if (!userId) return;

    const deletedKey = getDeletedStorageKey(userId);
    const deletedIds = getDeletedMessageIds(userId);
    const idString = String(id);

    const nextDeletedIds = deletedIds.includes(idString)
      ? deletedIds
      : [...deletedIds, idString];

    localStorage.setItem(deletedKey, JSON.stringify(nextDeletedIds));

    setMessages((prev) => {
      const nextMessages = prev.filter((item) => String(item.id) !== idString);
      const storageKey = getMessagesStorageKey(userId);

      localStorage.setItem(storageKey, JSON.stringify(nextMessages));

      return nextMessages;
    });
  }

  const orderedMessages = [...messages].reverse();

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={handleLauncherClick}
          className="fixed bottom-16 right-7 z-[9999] h-[105px] w-[105px] transition-transform hover:scale-110"
        >
          <Image
            src="/orivoo-logo.png"
            alt="ORIVOO"
            width={105}
            height={105}
            priority
            loading="eager"
            style={{
              width: "105px",
              height: "105px",
              objectFit: "contain",
            }}
            className="drop-shadow-[0_0_25px_rgba(255,215,0,0.9)]"
          />
        </button>
      )}

      {open && userId && (
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

                    {userEmail && (
                      <p className="mt-1 max-w-[200px] truncate text-xs text-zinc-500">
                        Signed in: {userEmail}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 relative -top-4 md:top-0"
                >
                  Close
                </button>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="mt-4 w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </button>
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

            <div className="border-t border-zinc-800 bg-black p-5 pb-10 md:pb-5">
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