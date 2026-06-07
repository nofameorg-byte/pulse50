"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import ShareMenu from "../../components/ShareMenu";
import { CATEGORY_COLORS } from "../../lib/constants";

import {
  triggerReplyNotifications,
  triggerVoteMilestone,
  triggerStateActivityNotification,
} from "../../lib/notifications";

interface Representative {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  city?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  reported?: boolean;
  // Civic identity — replaces username
  profiles: { civic_name: string; state_abbr: string };
  like_count?: number;
  user_liked?: boolean;
  replies?: Comment[];
}

export default function RepresentativeProfile() {
  const params = useParams();
  const router = useRouter();
  const representativeId = Number(params.id);

  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvalCount, setApprovalCount] = useState(0);
  const [disapprovalCount, setDisapprovalCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [userVote, setUserVote] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  // Like state
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!representativeId) return;
    fetchRepresentative();
    fetchComments();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user ? { id: user.id } : null);
    });

    const channel = supabase
      .channel(`profile-${representativeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, fetchComments)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_votes" }, fetchRepresentative)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [representativeId]);

  async function fetchRepresentative() {
    const { data, error } = await supabase
      .from("representatives").select("*").eq("id", representativeId).single();
    if (error) { console.error(error); return; }
    setRepresentative(data);

    const { data: voteData } = await supabase
      .from("user_votes").select("*").eq("representative_id", representativeId);

    setApprovalCount(voteData?.filter((v) => v.vote_type === "approve").length || 0);
    setDisapprovalCount(voteData?.filter((v) => v.vote_type === "disapprove").length || 0);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const myVote = voteData?.find((v) => v.user_id === user.id);
      setUserVote(myVote?.vote_type || null);
    }
  }

  async function fetchComments() {
    const { data: commentsData, error } = await supabase
      .from("comments").select("*")
      .eq("representative_id", representativeId)
      .eq("hidden", false)
      .order("created_at", { ascending: true });

    if (error) { console.error(error); return; }
    if (!commentsData) { setComments([]); return; }

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch civic identity + likes for all comments in parallel
    const withData = await Promise.all(
      commentsData.map(async (comment) => {
        const [profileRes, likeCountRes, userLikeRes] = await Promise.all([
          // Fetch civic_name and state_abbr instead of username
          supabase.from("profiles").select("civic_name,state_abbr").eq("id", comment.user_id).single(),
          supabase.from("comment_likes").select("*", { count: "exact", head: true }).eq("comment_id", comment.id),
          user
        
             ? supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", comment.id)
      .eq("user_id", user.id)
      .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        return {
          ...comment,
          profiles: {
            civic_name: profileRes.data?.civic_name || "Citizen",
            state_abbr: profileRes.data?.state_abbr || "US",
          },
          like_count: likeCountRes.count || 0,
          user_liked: !!userLikeRes.data,
        };
      })
    );

    // Build threaded structure
    const topLevel = withData.filter((c) => !c.parent_id);
    const threaded = topLevel.map((c) => ({
      ...c,
      replies: withData.filter((r) => r.parent_id === c.id),
    }));

    // Update like state maps
    const newLikedIds = new Set<string>();
    const newLikeCounts: Record<string, number> = {};
    withData.forEach((c) => {
      newLikeCounts[c.id] = c.like_count || 0;
      if (c.user_liked) newLikedIds.add(c.id);
    });
    setLikedIds(newLikedIds);
    setLikeCounts(newLikeCounts);

    setComments(threaded);
  }

  // ensureProfile no longer creates usernames — civic identity is set at signup
  async function ensureProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("id").eq("id", userId).single();
    if (data) return;
    // Profile missing — insert a minimal fallback (civic identity assigned at signup)
    await supabase.from("profiles").insert({
      id: userId,
      civic_name: "Citizen",
      state_abbr: "US",
      is_admin: false,
      banned: false,
    });
  }

  async function handleVote(voteType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (userVote === voteType) return;

    setVoting(true);
    if (userVote) {
      await supabase.from("user_votes")
        .update({ vote_type: voteType })
        .eq("representative_id", representativeId).eq("user_id", user.id);
    } else {
      await supabase.from("user_votes")
        .insert({ representative_id: representativeId, user_id: user.id, vote_type: voteType });
    }
    setUserVote(voteType);
    setVoting(false);
    fetchRepresentative();

    if (representative) {
      const newTotal = approvalCount + disapprovalCount + 1;
      triggerVoteMilestone(representativeId, representative.name, newTotal);
      triggerStateActivityNotification(representative.state, representative.name, representativeId);
    }
  }

  async function postComment() {
    if (!commentText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const lastComment = comments[0];
    if (lastComment && lastComment.user_id === user.id && lastComment.content === commentText.trim()) {
      alert("You already posted that comment.");
      return;
    }

    setPosting(true);
    await ensureProfile(user.id);

    const { error } = await supabase.from("comments").insert({
      representative_id: representativeId,
      user_id: user.id,
      content: commentText.trim(),
      hidden: false,
    });

    if (error) { console.error(error); setPosting(false); return; }
    setCommentText("");
    setPosting(false);
    fetchComments();

    if (representative) {
      triggerReplyNotifications(representativeId, representative.name, user.id);
    }
  }

  async function reportComment(commentId: string) {
    if (reportedIds.has(commentId)) return;
    setReportingId(commentId);

    await supabase.from("comment_reports").insert({
      comment_id: commentId,
      reporter_id: currentUser?.id || null,
      reason: "flagged_by_user",
    });

    setReportedIds((prev) => new Set([...prev, commentId]));
    setReportingId(null);
  }

  async function postReply(parentId: string) {
    if (!replyText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setPostingReply(true);
    await ensureProfile(user.id);

    const { error } = await supabase.from("comments").insert({
      representative_id: representativeId,
      user_id: user.id,
      content: replyText.trim(),
      parent_id: parentId,
      hidden: false,
    });

    if (error) { console.error(error); setPostingReply(false); return; }
    setReplyText("");
    setReplyingTo(null);
    setPostingReply(false);
    fetchComments();

    if (representative) {
      triggerReplyNotifications(representativeId, representative.name, user.id);
    }
  }

  async function toggleLike(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const alreadyLiked = likedIds.has(commentId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (alreadyLiked ? -1 : 1),
    }));

    if (alreadyLiked) {
      await supabase.from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
  }

  if (!representative) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black text-yellow-400/20 mb-4">Loading...</div>
          <p className="text-gray-500">Fetching data</p>
        </div>
      </main>
    );
  }

  const totalVotes = approvalCount + disapprovalCount;
  const approvalPercent = totalVotes > 0 ? Math.round((approvalCount / totalVotes) * 100) : 0;
  const disapprovalPercent = totalVotes > 0 ? 100 - approvalPercent : 0;
  const tagColor = CATEGORY_COLORS[representative.category?.toLowerCase()] ?? "bg-yellow-400 text-black";
  const statsText = `${approvalPercent}% approval · ${totalVotes.toLocaleString()} votes`;
  const profileUrl = `/representatives/${representative.id}`;

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight shrink-0">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/representatives" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
              Directory
            </Link>
            <Link href="/trending" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
              Trending
            </Link>
            <Link href="/polls" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
              Polls
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
  <div className="md:hidden border-t border-white/10 bg-black px-4 py-6">
    <div className="grid grid-cols-2 gap-y-6">

      <Link
        href="/representatives"
        className="text-xl font-black uppercase tracking-wider text-yellow-400"
      >
        Directory
      </Link>

      <Link
        href="/trending"
        className="text-xl font-black uppercase tracking-wider text-gray-400"
      >
        Trending
      </Link>

      <Link
        href="/now"
        className="text-xl font-black uppercase tracking-wider text-gray-400"
      >
        PulseNow
      </Link>

      <Link
        href="/now/townhall"
        className="text-xl font-black uppercase tracking-wider text-gray-400"
      >
        TownHall
      </Link>

      <Link
        href="/polls"
        className="text-xl font-black uppercase tracking-wider text-gray-400"
      >
        Polls
      </Link>

      <Link
        href="/login"
        className="text-xl font-black uppercase tracking-wider text-gray-400"
      >
        Account
      </Link>

    </div>
  </div>
)}
      </nav>

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">

        {/* ── PROFILE CARD ── */}
        <div className="border border-white/10 bg-white/[0.02] relative mb-6">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
          <div className="p-6 md:p-8">
            {/* Tags + share row */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black px-3 py-1 uppercase tracking-wider ${tagColor}`}>
                  {representative.category}
                </span>
                <span className="border border-white/20 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
                  {representative.state}
                </span>
                {representative.city && (
                  <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                    {representative.city}
                  </span>
                )}
              </div>
              <ShareMenu url={profileUrl} title={representative.name} stats={statsText} />
            </div>

            {/* Name & title */}
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-1">
              {representative.name}
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-8">{representative.title}</p>

            {/* Vote counts */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="border border-white/10 bg-black p-5">
                <div className="text-4xl md:text-5xl font-black text-yellow-400">
                  {approvalCount.toLocaleString()}
                </div>
                <p className="text-gray-500 mt-1 text-xs uppercase tracking-wider font-bold">Approvals</p>
              </div>
              <div className="border border-white/10 bg-black p-5">
                <div className="text-4xl md:text-5xl font-black text-red-400">
                  {disapprovalCount.toLocaleString()}
                </div>
                <p className="text-gray-500 mt-1 text-xs uppercase tracking-wider font-bold">Disapprovals</p>
              </div>
            </div>

            {/* Approval bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Approval Rating</span>
                <span className="text-2xl font-black text-yellow-400">{approvalPercent}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-1000"
                  style={{ width: `${approvalPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-yellow-400 font-bold">{approvalPercent}% approve</span>
                <span className="text-red-400 font-bold">{disapprovalPercent}% disapprove</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-2xl md:text-3xl font-black text-white">{totalVotes.toLocaleString()}</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Total Votes</p>
              </div>
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-2xl md:text-3xl font-black text-yellow-400">{approvalPercent}%</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Approval</p>
              </div>
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-2xl md:text-3xl font-black text-white">{comments.length}</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Comments</p>
              </div>
            </div>

            {/* Vote buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVote("approve")}
                disabled={voting}
                className={`py-4 md:py-5 font-black text-sm uppercase tracking-wider transition disabled:opacity-50 ${
                  userVote === "approve"
                    ? "bg-green-500 text-black"
                    : "bg-yellow-400 hover:bg-yellow-300 text-black"
                }`}
              >
                {userVote === "approve" ? "✓ You Approved" : "Approve"}
              </button>
              <button
                onClick={() => handleVote("disapprove")}
                disabled={voting}
                className={`py-4 md:py-5 font-black text-sm uppercase tracking-wider border transition disabled:opacity-50 ${
                  userVote === "disapprove"
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-red-500/40 text-red-400 hover:bg-red-500/10"
                }`}
              >
                {userVote === "disapprove" ? "✓ You Disapproved" : "Disapprove"}
              </button>
            </div>

            {/* Share stats CTA */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-xs text-gray-600">
                {userVote
                  ? <>You voted to <span className={userVote === "approve" ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>{userVote}</span>. Click the other to change.</>
                  : "Cast your vote above."}
              </p>
              <ShareMenu url={profileUrl} title={representative.name} stats={statsText} />
            </div>
          </div>
        </div>

        {/* ── DISCUSSION ── */}
        <div className="border border-white/10 bg-white/[0.02] relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl md:text-4xl font-black text-white">Discussion</h2>
              <span className="border border-yellow-400/30 text-yellow-400 text-xs font-black px-4 py-2 uppercase tracking-wider">
                {comments.length} comments
              </span>
            </div>

            {/* Comment input */}
            {currentUser ? (
              <div className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                  placeholder="Share your thoughts..."
                  className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 h-28 outline-none focus:border-yellow-400 transition text-sm resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">
                    {commentText.length}/500 · Be respectful
                  </span>
                  <div className="flex items-center gap-3">
                    <ShareMenu url={profileUrl} title={representative.name} stats={statsText} />
                    <button
                      onClick={postComment}
                      disabled={posting || !commentText.trim()}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-2.5 text-sm uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 border border-white/10 bg-black p-5 flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  <Link href="/login" className="text-yellow-400 font-bold hover:underline">Log in</Link> to join the discussion.
                </p>
                <Link href="/login" className="bg-yellow-400 text-black font-black px-5 py-2 text-sm uppercase tracking-wider hover:bg-yellow-300 transition">
                  Login
                </Link>
              </div>
            )}

            {/* Comments scroll container */}
            <div
              className="overflow-y-auto space-y-3 pr-1"
              style={{
                height: "480px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.08) transparent",
              }}
            >
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-600 text-lg font-bold">No comments yet.</p>
                  <p className="text-gray-700 text-sm mt-1">Be the first to share your thoughts.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    representative={representative}
                    profileUrl={profileUrl}
                    reportedIds={reportedIds}
                    reportingId={reportingId}
                    likedIds={likedIds}
                    likeCounts={likeCounts}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    postingReply={postingReply}
                    onReport={reportComment}
                    onToggleLike={toggleLike}
                    onReplyStart={(id) => { setReplyingTo(id); setReplyText(""); }}
                    onReplyCancel={() => { setReplyingTo(null); setReplyText(""); }}
                    onReplyTextChange={setReplyText}
                    onReplySubmit={postReply}
                  />
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </div>
          <p className="text-center text-xs text-gray-600">
            Public opinion platform. Not affiliated with any government entity.
          </p>
        </div>
      </footer>
      
    </main>
  );
}

// ─── CommentThread ─────────────────────────────────────────────────────────────

interface CommentThreadProps {
  comment: Comment;
  currentUser: { id: string } | null;
  representative: { name: string } | null;
  profileUrl: string;
  reportedIds: Set<string>;
  reportingId: string | null;
  likedIds: Set<string>;
  likeCounts: Record<string, number>;
  replyingTo: string | null;
  replyText: string;
  postingReply: boolean;
  onReport: (id: string) => void;
  onToggleLike: (id: string) => void;
  onReplyStart: (id: string) => void;
  onReplyCancel: () => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (parentId: string) => void;
  isReply?: boolean;
}

function CommentThread({
  comment, currentUser, representative, profileUrl,
  reportedIds, reportingId, likedIds, likeCounts,
  replyingTo, replyText, postingReply,
  onReport, onToggleLike, onReplyStart, onReplyCancel, onReplyTextChange, onReplySubmit,
  isReply = false,
}: CommentThreadProps) {
  const isReported = reportedIds.has(comment.id);
  const liked = likedIds.has(comment.id);
  const likeCount = likeCounts[comment.id] || 0;
  const showReplyBox = replyingTo === comment.id;

  // Civic identity display: "SC • Beacon4821"
  const civicDisplay = `${comment.profiles?.state_abbr || "US"} • ${comment.profiles?.civic_name || "Citizen"}`;
  // Avatar initial from state_abbr
  const avatarInitial = (comment.profiles?.state_abbr || "US")[0].toUpperCase();

  return (
    <div className={isReply ? "ml-8 mt-2" : ""}>
      <div className={`border bg-black p-4 hover:border-white/20 transition group ${
        isReply ? "border-white/5" : "border-white/10"
      }`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 text-xs font-black">{avatarInitial}</span>
            </div>
            {/* Civic identity badge */}
            <span className="text-yellow-400 font-bold text-sm">{civicDisplay}</span>
            {isReply && (
              <span className="text-gray-700 text-xs font-bold uppercase tracking-wider">↩ reply</span>
            )}
            <span className="text-gray-700 text-xs">
              {new Date(comment.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition shrink-0">
            <ShareMenu
              url={profileUrl}
              title={representative?.name || ""}
              commentText={comment.content}
              username={civicDisplay}
            />
            <button
              onClick={() => onReport(comment.id)}
              disabled={isReported || reportingId === comment.id}
              className={`border px-2 py-1 text-xs font-bold uppercase tracking-wider transition ${
                isReported
                  ? "border-gray-700 text-gray-700 cursor-default"
                  : "border-white/10 text-gray-500 hover:border-red-500/40 hover:text-red-400"
              }`}
            >
              {isReported ? "Reported" : "Report"}
            </button>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap pl-8 mb-3">
          {comment.content}
        </p>

        {/* Like + Reply row */}
        <div className="flex items-center gap-4 pl-8">
          <button
            onClick={() => onToggleLike(comment.id)}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
              liked ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{likeCount > 0 ? likeCount : "Helpful"}</span>
          </button>

          {!isReply && currentUser && (
            <button
              onClick={() => showReplyBox ? onReplyCancel() : onReplyStart(comment.id)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-400 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {showReplyBox ? "Cancel" : "Reply"}
            </button>
          )}
        </div>
      </div>

      {/* Reply input box */}
      {showReplyBox && (
        <div className="ml-8 mt-2 border border-yellow-400/20 bg-yellow-400/5 p-3">
          <textarea
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value.slice(0, 500))}
            placeholder={`Replying to ${civicDisplay}...`}
            className="w-full bg-black border border-white/10 px-3 py-3 text-white placeholder-gray-600 h-20 outline-none focus:border-yellow-400 transition text-sm resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">{replyText.length}/500</span>
            <div className="flex gap-2">
              <button
                onClick={onReplyCancel}
                className="border border-white/10 text-gray-500 font-bold px-4 py-1.5 text-xs uppercase tracking-wider hover:border-white/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onReplySubmit(comment.id)}
                disabled={postingReply || !replyText.trim()}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-1.5 text-xs uppercase tracking-wider transition disabled:opacity-40"
              >
                {postingReply ? "Posting..." : "Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1 mt-1">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              representative={representative}
              profileUrl={profileUrl}
              reportedIds={reportedIds}
              reportingId={reportingId}
              likedIds={likedIds}
              likeCounts={likeCounts}
              replyingTo={replyingTo}
              replyText={replyText}
              postingReply={postingReply}
              onReport={onReport}
              onToggleLike={onToggleLike}
              onReplyStart={onReplyStart}
              onReplyCancel={onReplyCancel}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}