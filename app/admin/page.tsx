"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface CivicVideo {
  id: string;
  title: string;
  youtube_id: string;
  state: string;
  state_abbr: string;
  county: string;
  labels: string[];
  position: number;
  enabled: boolean;
  support_count: number;
  unsupport_count: number;
  view_count: number;
  created_at: string;
}

const ALL_LABELS = [
  "Campaign", "MAGA", "Black Lives Matter", "Infrastructure",
  "Crime", "Education", "Economy", "Public Safety", "Government", "Housing",
];

const BLANK_VIDEO: Omit<CivicVideo, "id" | "created_at" | "support_count" | "unsupport_count" | "view_count"> = {
  title: "",
  youtube_id: "",
  state: "",
  state_abbr: "",
  county: "",
  labels: [],
  position: 0,
  enabled: true,
};

type AdminTab = "reports" | "comments" | "users" | "banned" | "pulsenow" | "polls";

// ── Main page ─────────────────────────────────────────────────────────────────
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
  const [polls, setPolls] = useState<any[]>([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollImageUrl, setPollImageUrl] = useState("");
  const [editingPoll, setEditingPoll] = useState<any | null>(null);
  
  // PulseNow state
  const [videos, setVideos] = useState<CivicVideo[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CivicVideo | null>(null);
  const [videoForm, setVideoForm] = useState<typeof BLANK_VIDEO>({ ...BLANK_VIDEO });
  const [videoSaving, setVideoSaving] = useState(false);

  useEffect(() => { checkAdmin(); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "reports")   fetchReports();
    if (tab === "comments")  fetchAllComments();
    if (tab === "banned")    fetchBanned();
    if (tab === "users")     fetchUsers();
    if (tab === "pulsenow")  fetchVideos();
    if (tab === "polls")     fetchPolls();
  }, [tab, isAdmin]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: profile } = await supabase
      .from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { router.push("/"); return; }
    setIsAdmin(true);
    setLoading(false);
  }

  // ── Comments / Reports / Users ────────────────────────────────────────────
  async function fetchReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from("comment_reports")
      .select(`*, comments(id, content, user_id, representative_id, hidden, profiles(username))`)
      .order("created_at", { ascending: false });
    if (!error) setReports(data || []);
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

async function fetchPolls() {
  const { data, error } = await supabase
    .from("pulse_polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) {
    setPolls(data || []);
  }
}

async function createPoll() {
  if (!pollQuestion.trim()) return;

  const { error } = await supabase
    .from("pulse_polls")
    .insert({
      question: pollQuestion.trim(),
      image_url: pollImageUrl.trim() || null,
      active: true,
    });

  if (!error) {
    setPollQuestion("");
    setPollImageUrl("");
    fetchPolls();
  }
}

function editPoll(poll: any) {
  setEditingPoll(poll);
  setPollQuestion(poll.question || "");
  setPollImageUrl(poll.image_url || "");
}

async function savePoll() {
  if (!editingPoll) return;

  const { error } = await supabase
    .from("pulse_polls")
    .update({
      question: pollQuestion.trim(),
      image_url: pollImageUrl.trim() || null,
    })
    .eq("id", editingPoll.id);

  if (!error) {
    setEditingPoll(null);
    setPollQuestion("");
    setPollImageUrl("");
    fetchPolls();
  }
}

async function deletePoll(id: number) {
  if (!confirm("Delete this poll?")) return;

  await supabase
    .from("pulse_polls")
    .delete()
    .eq("id", id);

  fetchPolls();
}

async function togglePoll(id: number, active: boolean) {
  await supabase
    .from("pulse_polls")
    .update({ active: !active })
    .eq("id", id);

  fetchPolls();
}

  async function hideComment(id: number) {
    await supabase.from("comments").update({ hidden: true }).eq("id", id);
    flash("Comment hidden.");
    fetchReports(); fetchAllComments();
  }
  async function unhideComment(id: number) {
    await supabase.from("comments").update({ hidden: false }).eq("id", id);
    flash("Comment restored.");
    fetchAllComments();
  }
  async function deleteComment(id: number) {
    await supabase.from("comment_reports").delete().eq("comment_id", id);
    await supabase.from("comments").delete().eq("id", id);
    flash("Comment deleted.");
    fetchReports(); fetchAllComments();
  }
  async function dismissReport(id: number) {
    await supabase.from("comment_reports").delete().eq("id", id);
    flash("Report dismissed.");
    fetchReports();
  }
  async function banUser(userId: string) {
    await supabase.from("profiles")
      .update({ banned: true, banned_at: new Date().toISOString() }).eq("id", userId);
    flash("User banned.");
    fetchUsers(); fetchBanned();
  }
  async function unbanUser(userId: string) {
    await supabase.from("profiles")
      .update({ banned: false, banned_at: null }).eq("id", userId);
    flash("User unbanned.");
    fetchBanned(); fetchUsers();
  }

  // ── PulseNow CRUD ─────────────────────────────────────────────────────────
  async function fetchVideos() {
    setVideoLoading(true);
    const { data, error } = await supabase
      .from("civic_videos")
      .select("*")
      .order("position", { ascending: true });
    if (!error) setVideos(data ?? []);
    setVideoLoading(false);
  }

  function openAddForm() {
    setEditingVideo(null);
    setVideoForm({ ...BLANK_VIDEO, position: videos.length + 1 });
    setShowVideoForm(true);
  }

  function openEditForm(v: CivicVideo) {
    setEditingVideo(v);
    setVideoForm({
      title: v.title,
      youtube_id: v.youtube_id,
      state: v.state ?? "",
      state_abbr: v.state_abbr ?? "",
      county: v.county ?? "",
      labels: v.labels ?? [],
      position: v.position,
      enabled: v.enabled,
    });
    setShowVideoForm(true);
  }

  function cancelForm() {
    setShowVideoForm(false);
    setEditingVideo(null);
    setVideoForm({ ...BLANK_VIDEO });
  }

  function toggleLabel(label: string) {
    setVideoForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((l) => l !== label)
        : [...prev.labels, label],
    }));
  }

  async function saveVideo() {
    if (!videoForm.title.trim() || !videoForm.youtube_id.trim()) {
      flash("Title and YouTube ID are required.");
      return;
    }
    setVideoSaving(true);
    if (editingVideo) {
      const { error } = await supabase
        .from("civic_videos")
        .update({
          title: videoForm.title.trim(),
          youtube_id: videoForm.youtube_id.trim(),
          state: videoForm.state.trim(),
          state_abbr: videoForm.state_abbr.trim().toUpperCase(),
          county: videoForm.county.trim(),
          labels: videoForm.labels,
          position: Number(videoForm.position),
          enabled: videoForm.enabled,
        })
        .eq("id", editingVideo.id);
      if (error) { flash("Error saving video."); }
      else { flash("Video updated."); cancelForm(); fetchVideos(); }
    } else {
      const { error } = await supabase
        .from("civic_videos")
        .insert({
          title: videoForm.title.trim(),
          youtube_id: videoForm.youtube_id.trim(),
          state: videoForm.state.trim(),
          state_abbr: videoForm.state_abbr.trim().toUpperCase(),
          county: videoForm.county.trim(),
          labels: videoForm.labels,
          position: Number(videoForm.position),
          enabled: videoForm.enabled,
          support_count: 0,
          unsupport_count: 0,
          view_count: 0,
        });
      if (error) { flash("Error adding video."); }
      else { flash("Video added."); cancelForm(); fetchVideos(); }
    }
    setVideoSaving(false);
  }

  async function deleteVideo(id: string) {
  if (!confirm("Delete this video permanently?")) return;
  await supabase.from("civic_videos").delete().eq("id", id);
  flash("Video deleted.");
  fetchVideos();
}

async function toggleEnabled(v: CivicVideo) {
  console.log("DISABLE BUTTON CLICKED");

  const { data: { user } } = await supabase.auth.getUser();

  console.log("TOGGLE AUTH USER:", user);
  console.log("TOGGLE AUTH USER ID:", user?.id);

  const result = await supabase
    .from("civic_videos")
    .update({ enabled: !v.enabled })
    .eq("id", v.id);

  console.log("TOGGLE RESULT:", result);
  console.log("TOGGLE ERROR:", result.error);

  flash(v.enabled ? "Video disabled." : "Video enabled.");
  fetchVideos();
}

async function moveVideo(v: CivicVideo, direction: "up" | "down") {
  const sorted = [...videos].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((x) => x.id === v.id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;

  if (swapIdx < 0 || swapIdx >= sorted.length) return;

  const other = sorted[swapIdx];

  await Promise.all([
    supabase
      .from("civic_videos")
      .update({ position: other.position })
      .eq("id", v.id),

    supabase
      .from("civic_videos")
      .update({ position: v.position })
      .eq("id", other.id),
  ]);

  fetchVideos();
}

function flash(msg: string) {
  setActionMsg(msg);
  setTimeout(() => setActionMsg(""), 3000);
}

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black text-yellow-400/20">Checking access...</div>
      </main>
    );
  }

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "reports",  label: "Reported Comments" },
    { id: "comments", label: "All Comments" },
    { id: "users",    label: "Users" },
    { id: "banned",   label: "Banned" },
    { id: "pulsenow", label: "PulseNow" },
    { id: "polls", label: "Polls" }
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

      {/* Flash */}
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
              {t.id === "pulsenow" && videos.length > 0 && (
                <span className="ml-2 bg-yellow-400/20 text-yellow-400 text-xs px-1.5 py-0.5 font-black border border-yellow-400/30">
                  {videos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── REPORTED COMMENTS ── */}
        {tab === "reports" && (
          loading ? <LoadingSkeleton /> : (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <EmptyState title="All Clear" subtitle="No reported comments." />
              ) : reports.map((r) => (
                <div key={r.id} className="border border-red-500/20 bg-red-500/5 p-5 relative">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/40" />
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          <span className="border border-gray-600 text-gray-500 text-xs px-2 py-0.5 font-bold uppercase">Hidden</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{r.comments?.content}</p>
                      <Link
                        href={`/representatives/${r.comments?.representative_id}`}
                        className="text-xs text-gray-600 hover:text-yellow-400 transition mt-1 inline-block"
                      >
                        View profile →
                      </Link>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {!r.comments?.hidden ? (
                        <AdminBtn onClick={() => hideComment(r.comments.id)} variant="gold">Hide</AdminBtn>
                      ) : (
                        <AdminBtn onClick={() => unhideComment(r.comments.id)} variant="ghost">Restore</AdminBtn>
                      )}
                      <AdminBtn onClick={() => deleteComment(r.comments.id)} variant="red">Delete</AdminBtn>
                      <AdminBtn onClick={() => banUser(r.comments.user_id)} variant="darkred">Ban User</AdminBtn>
                      <AdminBtn onClick={() => dismissReport(r.id)} variant="ghost">Dismiss</AdminBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── ALL COMMENTS ── */}
        {tab === "comments" && (
          loading ? <LoadingSkeleton /> : (
            <div className="space-y-3">
              {allComments.map((c) => (
                <div
                  key={c.id}
                  className={`border p-5 relative ${c.hidden ? "border-white/5 bg-white/[0.01] opacity-50" : "border-white/10 bg-white/[0.02]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-yellow-400 font-bold text-sm">@{c.profiles?.username || "Citizen"}</span>
                        <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                        {c.hidden && <span className="border border-gray-700 text-gray-500 text-xs px-2 py-0.5 font-bold uppercase">Hidden</span>}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed truncate">{c.content}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!c.hidden
                        ? <AdminBtn onClick={() => hideComment(c.id)} variant="gold">Hide</AdminBtn>
                        : <AdminBtn onClick={() => unhideComment(c.id)} variant="ghost">Restore</AdminBtn>
                      }
                      <AdminBtn onClick={() => deleteComment(c.id)} variant="red">Delete</AdminBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          loading ? <LoadingSkeleton /> : (
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
                    {!u.banned
                      ? <AdminBtn onClick={() => banUser(u.id)} variant="red">Ban</AdminBtn>
                      : <AdminBtn onClick={() => unbanUser(u.id)} variant="ghost">Unban</AdminBtn>
                    }
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── BANNED ── */}
        {tab === "banned" && (
          loading ? <LoadingSkeleton /> : (
            <div className="space-y-3">
              {bannedUsers.length === 0 ? (
                <EmptyState title="No Banned Users" />
              ) : bannedUsers.map((u) => (
                <div key={u.id} className="border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-white font-bold">@{u.username}</span>
                    <p className="text-gray-600 text-xs mt-1">
                      Banned {u.banned_at ? new Date(u.banned_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <AdminBtn onClick={() => unbanUser(u.id)} variant="ghost">Unban</AdminBtn>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── PULSENOW ── */}
        {tab === "pulsenow" && (
          <div>
            {/* Add video button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
                  Pulse50 Now
                </p>
                <h2 className="text-2xl font-black text-white">
                  {videos.length} Video{videos.length !== 1 ? "s" : ""}
                </h2>
              </div>
              {!showVideoForm && (
                <button
                  onClick={openAddForm}
                  className="px-5 py-3 bg-yellow-400 text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 transition"
                >
                  + Add Video
                </button>
              )}
            </div>
            

            {/* ── Add / Edit form ── */}
            {showVideoForm && (
              <div className="border border-yellow-400/30 bg-yellow-400/[0.03] p-6 mb-6 relative">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400 mb-5">
                  {editingVideo ? "Edit Video" : "Add New Video"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={videoForm.title}
                      onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Video title..."
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      YouTube ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={videoForm.youtube_id}
                      onChange={(e) => setVideoForm((p) => ({ ...p, youtube_id: e.target.value }))}
                      placeholder="e.g. dQw4w9WgXcQ"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
                    />
                    {videoForm.youtube_id && (
                      <p className="text-gray-600 text-xs mt-1">
                        Preview:{" "}
                        <a
                          href={`https://youtu.be/${videoForm.youtube_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-yellow-400 hover:underline"
                        >
                          youtu.be/{videoForm.youtube_id}
                        </a>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      County
                    </label>
                    <input
                      type="text"
                      value={videoForm.county}
                      onChange={(e) => setVideoForm((p) => ({ ...p, county: e.target.value }))}
                      placeholder="e.g. Aiken County"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={videoForm.state}
                      onChange={(e) => setVideoForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="e.g. South Carolina"
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      State Abbr
                    </label>
                    <input
                      type="text"
                      value={videoForm.state_abbr}
                      onChange={(e) => setVideoForm((p) => ({ ...p, state_abbr: e.target.value }))}
                      placeholder="e.g. SC"
                      maxLength={2}
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                      Position
                    </label>
                    <input
                      type="number"
                      value={videoForm.position}
                      onChange={(e) => setVideoForm((p) => ({ ...p, position: Number(e.target.value) }))}
                      min={1}
                      className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>


                {/* Labels */}
                <div className="mb-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_LABELS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition ${
                          videoForm.labels.includes(label)
                            ? "bg-yellow-400 text-black border-yellow-400"
                            : "border-white/10 text-gray-400 hover:border-yellow-400/40 hover:text-yellow-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enabled toggle */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setVideoForm((p) => ({ ...p, enabled: !p.enabled }))}
                    className={`relative w-10 h-5 transition ${videoForm.enabled ? "bg-yellow-400" : "bg-white/10"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${videoForm.enabled ? "left-5.5 left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                  <span className={`text-xs font-black uppercase tracking-wider ${videoForm.enabled ? "text-yellow-400" : "text-gray-500"}`}>
                    {videoForm.enabled ? "Enabled — visible on /now" : "Disabled — hidden from /now"}
                  </span>
                </div>

                {/* Form actions */}
                <div className="flex gap-3">
                  <button
                    onClick={saveVideo}
                    disabled={videoSaving}
                    className="px-6 py-2.5 bg-yellow-400 text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 transition disabled:opacity-50"
                  >
                    {videoSaving ? "Saving..." : editingVideo ? "Save Changes" : "Add Video"}
                  </button>
                  <button
                    onClick={cancelForm}
                    className="px-6 py-2.5 border border-white/10 text-gray-400 font-black text-xs uppercase tracking-wider hover:border-white/30 hover:text-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Video list ── */}
            {videoLoading ? (
              <LoadingSkeleton />
            ) : videos.length === 0 ? (
              <EmptyState title="No Videos" subtitle="Add your first video above." />
            ) : (
              <div className="space-y-2">
                {videos.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`border p-4 flex items-center gap-4 transition ${
                      v.enabled
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-white/5 bg-white/[0.01] opacity-60"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-12 shrink-0 overflow-hidden bg-black">
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-white font-black text-sm truncate">{v.title}</span>
                        {!v.enabled && (
                          <span className="border border-gray-700 text-gray-500 text-xs px-2 py-0.5 font-bold uppercase shrink-0">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span>#{v.position}</span>
                        <span>{v.youtube_id}</span>
                        {v.county && <span>{v.county}</span>}
                        {v.state_abbr && <span>{v.state_abbr}</span>}
                        {v.labels?.length > 0 && (
                          <span className="text-yellow-400/60">{v.labels.join(", ")}</span>
                        )}
                        <span>{v.support_count} support · {v.unsupport_count} unsupport</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Move up/down */}
                      <button
                        onClick={() => moveVideo(v, "up")}
                        disabled={idx === 0}
                        className="w-7 h-7 border border-white/10 text-gray-500 hover:border-yellow-400/40 hover:text-yellow-400 transition text-xs font-black disabled:opacity-20 flex items-center justify-center"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveVideo(v, "down")}
                        disabled={idx === videos.length - 1}
                        className="w-7 h-7 border border-white/10 text-gray-500 hover:border-yellow-400/40 hover:text-yellow-400 transition text-xs font-black disabled:opacity-20 flex items-center justify-center"
                        title="Move down"
                      >
                        ↓
                      </button>
                      {/* Enable/Disable */}
                      <button
                        onClick={() => toggleEnabled(v)}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition ${
                          v.enabled
                            ? "border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
                            : "border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                        }`}
                      >
                        {v.enabled ? "Disable" : "Enable"}
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEditForm(v)}
                        className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400 transition"
                      >
                        Edit
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteVideo(v.id)}
                        className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

{/* ── POLLS ── */}
{tab === "polls" && (
  <div>
    <div className="border border-white/10 bg-white/[0.02] p-5 mb-6">
      <h3 className="text-lg font-black text-yellow-400 mb-4">
        {editingPoll ? "Edit Poll" : "Create Poll"}
      </h3>

      <input
        type="text"
        value={pollQuestion}
        onChange={(e) => setPollQuestion(e.target.value)}
        placeholder="Poll Question"
        className="w-full mb-3 bg-black border border-white/10 p-3 text-white"
      />

      <input
        type="text"
        value={pollImageUrl}
        onChange={(e) => setPollImageUrl(e.target.value)}
        placeholder="Image URL (optional)"
        className="w-full mb-4 bg-black border border-white/10 p-3 text-white"
      />

      <div className="flex gap-2">
        {editingPoll ? (
          <>
            <button
              onClick={savePoll}
              className="bg-yellow-400 text-black px-5 py-2 font-black uppercase"
            >
              Save Changes
            </button>

            <button
              onClick={() => {
                setEditingPoll(null);
                setPollQuestion("");
                setPollImageUrl("");
              }}
              className="border border-white/10 px-5 py-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={createPoll}
            className="bg-yellow-400 text-black px-5 py-2 font-black uppercase"
          >
            Create Poll
          </button>
        )}
      </div>
    </div>

    <div className="space-y-3">
      {polls.map((poll) => (
        <div
          key={poll.id}
          className="border border-white/10 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">
                {poll.question}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Poll #{poll.id}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => editPoll(poll)}
                className="px-3 py-1 border border-yellow-400 text-yellow-400 text-xs font-black uppercase"
              >
                Edit
              </button>

              <button
                onClick={() => togglePoll(poll.id, poll.active)}
                className="px-3 py-1 border border-white/10 text-white text-xs font-black uppercase"
              >
                {poll.active ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() => deletePoll(poll.id)}
                className="px-3 py-1 border border-red-500 text-red-400 text-xs font-black uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </div>
          <p className="text-xs text-gray-600">Admin access only.</p>
        </div>
      </footer>
    </main>
  );
}

// ── Shared micro-components ───────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border border-white/10 bg-white/[0.02] p-5 animate-pulse h-20" />
      ))}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-20 border border-white/10">
      <p className="text-3xl font-black text-white/10 mb-2">{title}</p>
      {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
    </div>
  );
}

type BtnVariant = "gold" | "ghost" | "red" | "darkred";
function AdminBtn({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: BtnVariant;
  children: React.ReactNode;
}) {
  const cls: Record<BtnVariant, string> = {
    gold:    "bg-yellow-400 text-black hover:bg-yellow-300",
    ghost:   "border border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400",
    red:     "border border-red-500/40 text-red-400 hover:bg-red-500/10",
    darkred: "border border-red-800/40 text-red-600 hover:bg-red-900/20",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${cls[variant]}`}
    >
      {children}
    </button>
  );
}
