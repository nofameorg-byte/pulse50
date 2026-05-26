"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

interface ReportedComment {
  id: number;
  comment_id: number;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  comments: {
    id: number;
    content: string;
    user_id: string;
    representative_id: number;
    hidden: boolean;
    profiles: { username: string };
  };
}

interface BannedUser {
  id: string;
  username: string;
  banned_at: string;
}

type AdminTab = "reports" | "banned" | "comments" | "users";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("reports");
  const [reports, setReports] = useState<ReportedComment[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "reports") fetchReports();
    if (tab === "comments") fetchAllComments();
    if (tab === "banned") fetchBanned();
    if (tab === "users") fetchUsers();
  }, [tab, isAdmin]);

  async function checkAdmin() {
  setLoading(true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    setTimeout(async () => {
      const {
        data: { session: retrySession },
      } = await supabase.auth.getSession();

      if (!retrySession?.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", retrySession.user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }, 700);

    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (!profile?.is_admin) {
    router.push("/");
    return;
  }

  setIsAdmin(true);
  setLoading(false);
}

  async function fetchReports() {
  setLoading(true);

  const { data, error } = await supabase
    .from("comment_reports")
    .select(`
      id,
      reason,
      created_at,
      comments (
        id,
        content,
        user_id,
        representative_id,
        hidden
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setLoading(false);
    return;
  }

  const reportsWithProfiles = await Promise.all(
    (data || []).map(async (report: any) => {
      if (!report.comments?.user_id) {
        return report;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", report.comments.user_id)
        .single();

      return {
        ...report,
        comments: {
          ...report.comments,
          profiles: {
            username: profile?.username || "Citizen",
          },
        },
      };
    })
  );

  setReports(reportsWithProfiles);
  setLoading(false);
}

  async function fetchAllComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(100);
    setAllComments(data || []);
    setLoading(false);
  }

  async function fetchBanned() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, banned_at")
      .eq("banned", true)
      .order("banned_at", { ascending: false });
    setBannedUsers(data || []);
    setLoading(false);
  }

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, created_at, banned, is_admin")
      .order("created_at", { ascending: false })
      .limit(100);
    setAllUsers(data || []);
    setLoading(false);
  }

  async function hideComment(commentId: number) {
    await supabase.from("comments").update({ hidden: true }).eq("id", commentId);
    flash("Comment hidden.");
    fetchReports();
    fetchAllComments();
  }

  async function unhideComment(commentId: number) {
    await supabase.from("comments").update({ hidden: false }).eq("id", commentId);
    flash("Comment restored.");
    fetchAllComments();
  }

  async function deleteComment(commentId: number) {
    await supabase.from("comment_reports").delete().eq("comment_id", commentId);
    await supabase.from("comments").delete().eq("id", commentId);
    flash("Comment deleted.");
    fetchReports();
    fetchAllComments();
  }

  async function dismissReport(reportId: number) {
    await supabase.from("comment_reports").delete().eq("id", reportId);
    flash("Report dismissed.");
    fetchReports();
  }

  async function banUser(userId: string) {
  const bannedAt = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      banned: true,
      banned_at: bannedAt,
    })
    .eq("id", userId);

  if (error) {
    flash("Failed to ban user.");
    console.error(error);
    return;
  }

  setAllUsers((prev) =>
    prev.map((user) =>
      user.id === userId
        ? {
            ...user,
            banned: true,
            banned_at: bannedAt,
          }
        : user
    )
  );

  setBannedUsers((prev) => {
    const user = allUsers.find((u) => u.id === userId);

    if (!user) return prev;

    return [
      {
        id: user.id,
        username: user.username,
        banned_at: bannedAt,
      },
      ...prev,
    ];
  });

  flash("User banned.");
}

async function unbanUser(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      banned: false,
      banned_at: null,
    })
    .eq("id", userId);

  if (error) {
    flash("Failed to unban user.");
    console.error(error);
    return;
  }

  setAllUsers((prev) =>
    prev.map((user) =>
      user.id === userId
        ? {
            ...user,
            banned: false,
            banned_at: null,
          }
        : user
    )
  );

  setBannedUsers((prev) =>
    prev.filter((user) => user.id !== userId)
  );

  flash("User unbanned.");
}

  function flash(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black text-yellow-400/20 mb-4">Checking access...</div>
        </div>
      </main>
    );
  }

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "reports", label: "Reported Comments" },
    { id: "comments", label: "All Comments" },
    { id: "users", label: "Users" },
    { id: "banned", label: "Banned" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
            <span className="ml-3 text-xs font-black uppercase tracking-widest text-red-400 border border-red-400/30 px-2 py-0.5">Admin</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
            ← Back to Site
          </Link>
        </div>
      </nav>

      {/* Flash message */}
      {actionMsg && (
        <div className="fixed top-20 right-6 z-50 bg-yellow-400 text-black font-black px-5 py-3 text-sm uppercase tracking-wider shadow-xl">
          {actionMsg}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Restricted Access</p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none">
            ADMIN<br />
            <span className="text-yellow-400">DASHBOARD</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-5 py-3 text-xs font-black uppercase tracking-wider border transition ${
                tab === t.id
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
              }`}
            >
              {t.label}
              {t.id === "reports" && reports.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 font-black">
                  {reports.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-white/10 bg-white/[0.02] p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {/* ── REPORTED COMMENTS ── */}
            {tab === "reports" && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="text-center py-20 border border-white/10">
                    <p className="text-3xl font-black text-white/10 mb-2">All Clear</p>
                    <p className="text-gray-600 text-sm">No reported comments.</p>
                  </div>
                ) : reports.map((r) => (
                  <div key={r.id} className="border border-red-500/20 bg-red-500/5 p-5 relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/40" />
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-400 font-bold text-sm">
                            @{r.comments?.profiles?.username || "Unknown"}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                          <span className="border border-red-500/30 text-red-400 text-xs px-2 py-0.5 font-bold uppercase">
                            {r.reason}
                          </span>
                          {r.comments?.hidden && (
                            <span className="border border-gray-600 text-gray-500 text-xs px-2 py-0.5 font-bold uppercase">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {r.comments?.content}
                        </p>
                        <Link
                          href={`/representatives/${r.comments?.representative_id}`}
                          className="text-xs text-gray-600 hover:text-yellow-400 transition mt-1 inline-block"
                        >
                          View profile →
                        </Link>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {!r.comments?.hidden ? (
                          <button
                            onClick={() => hideComment(r.comments.id)}
                            className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-300 transition"
                          >
                            Hide
                          </button>
                        ) : (
                          <button
                            onClick={() => unhideComment(r.comments.id)}
                            className="px-3 py-1.5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-wider hover:border-yellow-400 hover:text-yellow-400 transition"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(r.comments.id)}
                          className="px-3 py-1.5 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/10 transition"
                        >
                          Delete
                        </button>
                          
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ALL COMMENTS ── */}
            {tab === "comments" && (
              <div className="space-y-3">
                {allComments.map((c) => (
                  <div
                    key={c.id}
                    className={`border p-5 relative ${c.hidden ? "border-white/5 bg-white/[0.01] opacity-50" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-yellow-400 font-bold text-sm">
                            @{c.profiles?.username || "Citizen"}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          {c.hidden && (
                            <span className="border border-gray-700 text-gray-500 text-xs px-2 py-0.5 font-bold uppercase">Hidden</span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed truncate">{c.content}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!c.hidden ? (
                          <button onClick={() => hideComment(c.id)} className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-black uppercase hover:bg-yellow-300 transition">Hide</button>
                        ) : (
                          <button onClick={() => unhideComment(c.id)} className="px-3 py-1.5 border border-white/10 text-gray-400 text-xs font-black uppercase hover:border-yellow-400 hover:text-yellow-400 transition">Restore</button>
                        )}
                        <button onClick={() => deleteComment(c.id)} className="px-3 py-1.5 border border-red-500/40 text-red-400 text-xs font-black uppercase hover:bg-red-500/10 transition">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div className="space-y-3">
                {allUsers.map((u) => (
                  <div key={u.id} className={`border p-5 flex items-center justify-between gap-4 ${u.banned ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/[0.02]"}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">@{u.username || "Unnamed"}</span>
                        {u.is_admin && <span className="bg-yellow-400 text-black text-xs font-black px-2 py-0.5 uppercase">Admin</span>}
                        {u.banned && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 uppercase">Banned</span>}
                      </div>
                      <p className="text-gray-600 text-xs">
                        Joined {new Date(u.created_at).toLocaleDateString()} · ID: {u.id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!u.banned ? (
                        <button onClick={() => banUser(u.id)} className="px-3 py-1.5 border border-red-500/40 text-red-400 text-xs font-black uppercase hover:bg-red-500/10 transition">Ban</button>
                      ) : (
                        <button onClick={() => unbanUser(u.id)} className="px-3 py-1.5 border border-white/10 text-gray-400 text-xs font-black uppercase hover:border-yellow-400 hover:text-yellow-400 transition">Unban</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BANNED ── */}
            {tab === "banned" && (
              <div className="space-y-3">
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-20 border border-white/10">
                    <p className="text-3xl font-black text-white/10 mb-2">No Banned Users</p>
                  </div>
                ) : bannedUsers.map((u) => (
                  <div key={u.id} className="border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-white font-bold">@{u.username}</span>
                      <p className="text-gray-600 text-xs mt-1">
                        Banned {u.banned_at ? new Date(u.banned_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <button onClick={() => unbanUser(u.id)} className="px-3 py-1.5 border border-white/10 text-gray-400 text-xs font-black uppercase hover:border-yellow-400 hover:text-yellow-400 transition">Unban</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black"><span className="text-white">Pulse</span><span className="text-yellow-400">50</span></div>
          <p className="text-xs text-gray-600">Admin access only.</p>
        </div>
      </footer>
    </main>
  );
}
