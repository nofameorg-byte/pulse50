"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { CATEGORY_COLORS } from "../../lib/constants";

interface Profile {
  id: string;
  username: string;
  bio?: string;
  state?: string;
  created_at: string;
  banned?: boolean;
}

interface VoteHistory {
  id: number;
  vote_type: string;
  created_at: string;
  representatives: {
    id: number;
    name: string;
    title: string;
    state: string;
    category: string;
  };
}

interface CommentHistory {
  id: number;
  content: string;
  created_at: string;
  hidden: boolean;
  representatives: {
    id: number;
    name: string;
  };
}

type ProfileTab = "votes" | "comments";

export default function UserProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [votes, setVotes] = useState<VoteHistory[]>([]);
  const [comments, setComments] = useState<CommentHistory[]>([]);
  const [tab, setTab] = useState<ProfileTab>("votes");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    if (tab === "votes") fetchVotes();
    if (tab === "comments") fetchComments();
  }, [tab, profile]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setProfile(data);
    fetchVotes(data.id);
    setLoading(false);
  }

  async function fetchVotes(userId?: string) {
    const uid = userId || profile?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("user_votes")
      .select("*, representatives(id, name, title, state, category)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setVotes(data || []);
  }

  async function fetchComments(userId?: string) {
    const uid = userId || profile?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("comments")
      .select("*, representatives(id, name)")
      .eq("user_id", uid)
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    setComments(data || []);
  }

  const approveCount = votes.filter((v) => v.vote_type === "approve").length;
  const disapproveCount = votes.filter((v) => v.vote_type === "disapprove").length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black text-yellow-400/20">Loading...</div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-black text-white/10 mb-4">404</p>
          <p className="text-gray-400 mb-6">User not found.</p>
          <Link href="/" className="bg-yellow-400 text-black font-black px-6 py-3 text-sm uppercase tracking-wider hover:bg-yellow-300 transition">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/representatives" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Directory</Link>
            <Link href="/trending" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Trending</Link>
            <Link href="/polls" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">States</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account/settings" className="hidden md:block text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Settings</Link>
            <button className="md:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black px-4 py-4 space-y-3">
            <Link href="/representatives" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Directory</Link>
            <Link href="/trending" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/polls" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Polls</Link>
            <Link href="/account/settings" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Settings</Link>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">

        {/* Profile card */}
        <div className="border border-white/10 bg-white/[0.02] relative mb-6">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-2xl font-black">
                    {profile.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white">@{profile.username}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {profile.state && (
                      <span className="border border-white/20 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
                        {profile.state}
                      </span>
                    )}
                    <span className="text-gray-600 text-xs">
                      Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-300 text-sm leading-relaxed mb-6 border-l-2 border-yellow-400/30 pl-4">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-3xl font-black text-white">{votes.length}</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Total Votes</p>
              </div>
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-3xl font-black text-yellow-400">{approveCount}</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Approvals</p>
              </div>
              <div className="border border-white/10 bg-black p-4 text-center">
                <div className="text-3xl font-black text-red-400">{disapproveCount}</div>
                <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Disapprovals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "votes", label: `Votes (${votes.length})` },
            { id: "comments", label: `Comments (${comments.length})` },
          ] as { id: ProfileTab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs font-black uppercase tracking-wider border transition ${
                tab === t.id
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Vote history */}  
        {tab === "votes" && (
  <div className="space-y-3 max-h-[70vh] min-h-0 overflow-y-auto pr-2">
            {votes.length === 0 ? (
              <div className="text-center py-16 border border-white/10">
                <p className="text-3xl font-black text-white/10 mb-2">No Votes Yet</p>
                <p className="text-gray-600 text-sm">This user hasn't voted on anyone.</p>
              </div>
            ) : votes.map((v) => {
              const tagColor = CATEGORY_COLORS[v.representatives?.category?.toLowerCase()] ?? "bg-yellow-400 text-black";
              return (
                <Link
                  key={v.id}
                  href={`/representatives/${v.representatives?.id}`}
                  className="block border border-white/10 bg-white/[0.02] p-4 hover:border-yellow-400 transition group relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-black px-2 py-0.5 uppercase shrink-0 ${tagColor}`}>
                        {v.representatives?.category}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{v.representatives?.name}</p>
                        <p className="text-gray-500 text-xs truncate">{v.representatives?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-black px-3 py-1 uppercase tracking-wider border ${
                        v.vote_type === "approve"
                          ? "border-yellow-400/40 text-yellow-400"
                          : "border-red-500/40 text-red-400"
                      }`}>
                        {v.vote_type === "approve" ? "Approved" : "Disapproved"}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Comment history */}
        {tab === "comments" && (
  <div className="space-y-3 max-h-[70vh] min-h-0 overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <div className="text-center py-16 border border-white/10">
                <p className="text-3xl font-black text-white/10 mb-2">No Comments Yet</p>
                <p className="text-gray-600 text-sm">This user hasn't commented yet.</p>
              </div>
            ) : comments.map((c) => (
              <Link
                key={c.id}
                href={`/representatives/${c.representatives?.id}`}
                className="block border border-white/10 bg-white/[0.02] p-4 hover:border-yellow-400 transition group relative"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider">
                    {c.representatives?.name}
                  </span>
                  <span className="text-gray-600 text-xs shrink-0">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{c.content}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black"><span className="text-white">Pulse</span><span className="text-yellow-400">50</span></div>
          <p className="text-xs text-gray-600">Public opinion platform. Not affiliated with any government entity.</p>
        </div>
      </footer>
    </main>
  );
}
