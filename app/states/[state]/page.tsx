"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import VoteCard from "../../components/VoteCard";
import { CATEGORIES } from "../../lib/constants";
import MobileNav from "../../components/MobileNav";

interface Representative {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  city?: string;
  approve_count?: number;
  disapprove_count?: number;
  discussion_count?: number;
}

export default function StatePage() {
  const params = useParams();
  const router = useRouter();
  const rawState = decodeURIComponent((params.state as string).replace(/-/g, " "));
  const stateName = rawState.replace(/\b\w/g, (c) => c.toUpperCase());

  const [reps, setReps] = useState<Representative[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  const [votingId, setVotingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchReps();
    fetchUserVotes();
  }, [stateName]);

  async function fetchReps() {
    setLoading(true);
    const { data, error } = await supabase
      .from("representatives").select("*").eq("state", stateName);
    if (error) { console.error(error); setLoading(false); return; }

    const enriched = await Promise.all(
      (data || []).map(async (rep) => {
        const { data: approvals } = await supabase
          .from("user_votes").select("id").eq("representative_id", rep.id).eq("vote_type", "approve");
        const { data: disapprovals } = await supabase
          .from("user_votes").select("id").eq("representative_id", rep.id).eq("vote_type", "disapprove");
        const { count: discussions } = await supabase
          .from("comments").select("*", { count: "exact", head: true }).eq("representative_id", rep.id);
        return {
          ...rep,
          approve_count: approvals?.length || 0,
          disapprove_count: disapprovals?.length || 0,
          discussion_count: discussions || 0,
        };
      })
    );

    setReps(enriched);
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
    fetchReps();
  }

  const filtered = reps.filter(
    (r) => selectedCategory === "all" || r.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  // State-level stats
  const totalVotes = reps.reduce((sum, r) => sum + (r.approve_count || 0) + (r.disapprove_count || 0), 0);
  const totalApprove = reps.reduce((sum, r) => sum + (r.approve_count || 0), 0);
  const stateApproval = totalVotes > 0 ? Math.round((totalApprove / totalVotes) * 100) : 0;

  // Categories present in this state
  const presentCategories = CATEGORIES.filter(
    (cat) => cat.id === "all" || reps.some((r) => r.category.toLowerCase() === cat.id)
  );

  return (
    <main className="min-h-screen bg-black text-white pb-16 md:pb-0">

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/states" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">← States</Link>
            <Link href="/representatives" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Directory</Link>
            <Link href="/trending" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Trending</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black hover:bg-yellow-300 transition">Login</Link>
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
            <Link href="/states" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">← States</Link>
            <Link href="/representatives" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Directory</Link>
            <Link href="/trending" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/login" className="block w-full text-center bg-yellow-400 text-black font-black py-3 text-sm uppercase tracking-wider mt-2">Login</Link>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">

        {/* State header */}
        <div className="border border-white/10 bg-white/[0.02] relative p-6 md:p-8 mb-8">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />

          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">State Overview</p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none mb-6">
            {stateName.toUpperCase()}
          </h1>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-white/10 bg-black p-4 text-center">
              <div className="text-3xl font-black text-white">{reps.length}</div>
              <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Tracked</p>
            </div>
            <div className="border border-white/10 bg-black p-4 text-center">
              <div className="text-3xl font-black text-yellow-400">{stateApproval}%</div>
              <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Avg Approval</p>
            </div>
            <div className="border border-white/10 bg-black p-4 text-center">
              <div className="text-3xl font-black text-white">{totalVotes.toLocaleString()}</div>
              <p className="text-gray-600 text-xs uppercase tracking-wider mt-1 font-bold">Total Votes</p>
            </div>
          </div>

          {/* State approval bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">State Approval Average</span>
              <span className="text-xl font-black text-yellow-400">{stateApproval}%</span>
            </div>
            <div className="h-2 bg-white/10">
              <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${stateApproval}%` }} />
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8">
          {presentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wider border transition ${
                selectedCategory === cat.id
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-white/10 bg-white/[0.02] p-6 animate-pulse space-y-4">
                <div className="flex gap-2"><div className="h-6 w-20 bg-white/5" /><div className="h-6 w-12 bg-white/5" /></div>
                <div className="h-7 bg-white/5 w-3/4" />
                <div className="h-4 bg-white/5 w-1/2" />
                <div className="h-1.5 bg-white/5 w-full mt-4" />
                <div className="flex gap-3 pt-2"><div className="flex-1 h-12 bg-white/5" /><div className="flex-1 h-12 bg-white/5" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/10">
            <p className="text-4xl font-black text-white/10 mb-4">No entries</p>
            <p className="text-gray-600 text-sm">No representatives tracked for this filter in {stateName}.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((rep) => (
              <VoteCard
                key={rep.id}
                {...rep}
                userVote={userVotes[rep.id]}
                isVoting={votingId === rep.id}
                onApprove={() => handleVote(rep.id, "approve")}
                onDisapprove={() => handleVote(rep.id, "disapprove")}
              />
            ))}
          </div>
        )}
      </div>

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
