"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import VoteCard from "../components/VoteCard";
import { CATEGORIES } from "../lib/constants";
import { sortByMode } from "../lib/trending";
import type { SortMode as TrendingSortMode } from "../lib/trending";
import MobileNav from "../components/MobileNav";

interface TrendingItem {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  city?: string;
  approve_count?: number;
  disapprove_count?: number;
  discussion_count?: number;
  recent_votes?: number; // votes in last 24h
}

type SortMode = TrendingSortMode;

export default function TrendingPage() {
  const router = useRouter();
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  const [votingId, setVotingId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("trending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTrending();
    fetchUserVotes();

    const channel = supabase
      .channel("trending-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_votes" }, fetchTrending)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, fetchTrending)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchTrending() {
    setLoading(true);
    const { data, error } = await supabase.from("representatives").select("*");
    if (error) { console.error(error); setLoading(false); return; }

    const enriched = await Promise.all(
      (data || []).map(async (rep) => {
        const { data: approvals } = await supabase
          .from("user_votes").select("id, created_at")
          .eq("representative_id", rep.id).eq("vote_type", "approve");
        const { data: disapprovals } = await supabase
          .from("user_votes").select("id, created_at")
          .eq("representative_id", rep.id).eq("vote_type", "disapprove");
        const { count: discussions } = await supabase
          .from("comments").select("*", { count: "exact", head: true })
          .eq("representative_id", rep.id);

        const allVotes = [...(approvals || []), ...(disapprovals || [])];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const recentVotes = allVotes.filter(
          (v) => new Date(v.created_at).getTime() > cutoff
        ).length;

        return {
          ...rep,
          approve_count: approvals?.length || 0,
          disapprove_count: disapprovals?.length || 0,
          discussion_count: discussions || 0,
          recent_votes: recentVotes,
        };
      })
    );

    setItems(enriched);
    setLoading(false);
  }

  async function fetchUserVotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_votes").select("representative_id, vote_type").eq("user_id", user.id);
    const map: Record<number, string> = {};
    (data || []).forEach((v) => { map[v.representative_id] = v.vote_type; });
    setUserVotes(map);
  }

  async function handleVote(repId: number, voteType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (userVotes[repId] === voteType) return;

    setVotingId(repId);
    if (userVotes[repId]) {
      await supabase.from("user_votes")
        .update({ vote_type: voteType })
        .eq("representative_id", repId).eq("user_id", user.id);
    } else {
      await supabase.from("user_votes")
        .insert({ representative_id: repId, user_id: user.id, vote_type: voteType });
    }
    setUserVotes((prev) => ({ ...prev, [repId]: voteType }));
    setVotingId(null);
    fetchTrending();
  }

  const SORT_OPTIONS: { id: SortMode; label: string }[] = [
    { id: "trending",         label: "🔥 Trending" },
    { id: "most_votes",       label: "Most Votes" },
    { id: "recent",           label: "Hot Right Now" },
    { id: "most_discussed",   label: "Most Discussed" },
    { id: "most_approved",    label: "Highest Approval" },
    { id: "most_disapproved", label: "Most Disapproved" },
  ];

  const filtered = items.filter(
    (i) => selectedCategory === "all" || i.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const sorted = sortByMode(filtered, sortMode);

  return (
    <main className="min-h-screen bg-black text-white pb-16 md:pb-0">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/representatives" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Directory</Link>
            <Link href="/trending" className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Trending</Link>
            <Link href="/states" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Polls</Link>
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
          <div className="md:hidden border-t border-white/10 bg-black px-4 py-4 space-y-3">
            <Link href="/representatives" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Directory</Link>
            <Link href="/trending" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/states" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Polls</Link>
            
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">Live Rankings</p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none">
            TRENDING<br />
            <span className="text-yellow-400">DISCUSSIONS</span>
          </h1>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortMode(opt.id)}
              className={`shrink-0 px-4 py-2.5 text-xs font-black uppercase tracking-wider border transition ${
                sortMode === opt.id
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition ${
                selectedCategory === cat.id
                  ? "border-yellow-400/50 text-yellow-400"
                  : "border-white/10 text-gray-600 hover:text-gray-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Hot right now banner */}
        {sortMode === "recent" && (
          <div className="border border-yellow-400/20 bg-yellow-400/5 px-5 py-3 mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
              Ranked by votes cast in the last 24 hours
            </p>
          </div>
        )}

        {/* Slider */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shrink-0 w-[85vw] sm:w-[360px] border border-white/10 bg-white/[0.02] p-6 animate-pulse space-y-4">
                <div className="flex gap-2"><div className="h-6 w-20 bg-white/5" /><div className="h-6 w-12 bg-white/5" /></div>
                <div className="h-7 bg-white/5 w-3/4" />
                <div className="h-4 bg-white/5 w-1/2" />
                <div className="h-1.5 bg-white/5 w-full mt-4" />
                <div className="flex gap-3 pt-2"><div className="flex-1 h-12 bg-white/5" /><div className="flex-1 h-12 bg-white/5" /></div>
                <div className="h-11 bg-white/5 w-full" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24 border border-white/10">
            <p className="text-4xl font-black text-white/10 mb-4">Nothing yet</p>
            <p className="text-gray-600 text-sm">No data for this filter.</p>
          </div>
        ) : (
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {sorted.map((item, idx) => (
                <div key={item.id} className="snap-start shrink-0 w-[85vw] sm:w-[360px] relative">
                  
                  
                  {(() => {
  (globalThis as any).__TRENDING_RANK__ =
    idx < 3 ? idx + 1 : undefined;

  return (
      <VoteCard
  {...item}
  rank={idx + 1}
      userVote={userVotes[item.id]}
      isVoting={votingId === item.id}
      onApprove={() => handleVote(item.id, "approve")}
      onDisapprove={() => handleVote(item.id, "disapprove")}
    />
  );
})()}
                </div>
              ))}
            </div>
            {/* Scroll hint fade */}
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black"><span className="text-white">Pulse</span><span className="text-yellow-400">50</span></div>
          <p className="text-center text-xs text-gray-600">Public opinion platform. Not affiliated with any government entity.</p>
        </div>
      </footer>
      <MobileNav />
    </main>
  );
}
