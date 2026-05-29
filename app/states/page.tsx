"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import MobileNav from "../components/MobileNav";
import { US_STATES, STATE_ABBR } from "../lib/constants";

interface StateStats {
  state: string;
  abbr: string;
  total_reps: number;
  total_votes: number;
  avg_approval: number;
}

export default function StatesPage() {
  const [stats, setStats] = useState<StateStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "votes" | "approval">("votes");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStateStats();
  }, []);

  async function fetchStateStats() {
    setLoading(true);
    const { data: reps, error } = await supabase.from("representatives").select("id, state");
    if (error) { console.error(error); setLoading(false); return; }

    const stateMap: Record<string, { repIds: number[] }> = {};
    (reps || []).forEach((r) => {
      if (!stateMap[r.state]) stateMap[r.state] = { repIds: [] };
      stateMap[r.state].repIds.push(r.id);
    });

    const stateStats: StateStats[] = await Promise.all(
      Object.entries(stateMap).map(async ([state, { repIds }]) => {
        let totalApprove = 0, totalDisapprove = 0;

        await Promise.all(
          repIds.map(async (id) => {
            const { data: votes } = await supabase
              .from("user_votes").select("vote_type").eq("representative_id", id);
            totalApprove += (votes || []).filter((v) => v.vote_type === "approve").length;
            totalDisapprove += (votes || []).filter((v) => v.vote_type === "disapprove").length;
          })
        );

        const totalVotes = totalApprove + totalDisapprove;
        const avgApproval = totalVotes > 0 ? Math.round((totalApprove / totalVotes) * 100) : 0;

        return {
          state,
          abbr: STATE_ABBR[state] || state.slice(0, 2).toUpperCase(),
          total_reps: repIds.length,
          total_votes: totalVotes,
          avg_approval: avgApproval,
        };
      })
    );

    setStats(stateStats);
    setLoading(false);
  }

  const filtered = stats
    .filter((s) => s.state.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "alpha") return a.state.localeCompare(b.state);
      if (sortBy === "votes") return b.total_votes - a.total_votes;
      if (sortBy === "approval") return b.avg_approval - a.avg_approval;
      return 0;
    });

  return (
    <main className="min-h-screen bg-black text-white pb-16 md:pb-0">

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
            <Link href="/states" className="text-sm font-bold text-yellow-400 uppercase tracking-wider">States</Link>
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
            <Link href="/trending" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/states" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider py-2">States</Link>
            
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">Browse by Location</p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none">
            STATE<br />
            <span className="text-yellow-400">OVERVIEW</span>
          </h1>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search states..."
            className="flex-1 bg-black border border-white/10 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
          />
          <div className="flex gap-2">
            {[
              { id: "votes", label: "Most Active" },
              { id: "approval", label: "Highest Approval" },
              { id: "alpha", label: "A–Z" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id as typeof sortBy)}
                className={`px-4 py-3 text-xs font-black uppercase tracking-wider border transition ${
                  sortBy === opt.id
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="shrink-0 w-[160px] sm:w-[200px] border border-white/10 bg-white/[0.02] p-6 animate-pulse space-y-3">
                <div className="h-10 w-16 bg-white/5" />
                <div className="h-5 bg-white/5 w-3/4" />
                <div className="h-3 bg-white/5 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filtered.map((s) => (
                <Link
                  key={s.state}
                  href={`/states/${encodeURIComponent(s.state.toLowerCase().replace(/ /g, "-"))}`}
                  className="snap-start shrink-0 w-[160px] sm:w-[200px] border border-white/10 bg-white/[0.02] p-5 hover:border-yellow-400 transition group relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                  {/* Abbr */}
                  <div className="text-4xl font-black text-white/10 group-hover:text-yellow-400/20 transition mb-3 leading-none">
                    {s.abbr}
                  </div>

                  <h2 className="text-sm font-black text-white leading-tight mb-3">{s.state}</h2>

                  {/* Approval bar */}
                  <div className="h-1 bg-white/10 mb-3">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-700"
                      style={{ width: `${s.avg_approval}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-400 font-bold">{s.avg_approval}%</span>
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>{s.total_reps} reps</span>
                    <span>{s.total_votes.toLocaleString()}v</span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Scroll hint fade */}
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
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
