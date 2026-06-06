"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import VoteCard from "../components/VoteCard";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  US_STATES,
  STATE_ABBR,
} from "../lib/constants";
import MobileNav from "../components/MobileNav";

interface Representative {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  city?: string;
  county?: string;
  zip_code?: string;
  approve_count?: number;
  disapprove_count?: number;
  discussion_count?: number;
}

interface UserVote {
  representative_id: number;
  vote_type: string;
}


function RepresentativesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialState = searchParams.get("state") || "all";

  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState(initialState);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState<Representative[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  

  useEffect(() => {
    fetchRepresentatives();
    fetchUserVotes();
    

    const channel = supabase
      .channel("live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_votes" }, () => {
        fetchRepresentatives();
        fetchUserVotes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        fetchRepresentatives();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

 

    async function fetchRepresentatives() {
  setLoading(true);

  const { data, error } = await supabase
    .from("representatives_view")
    .select("*")
    .range(0, 99);

  if (error) {
    console.error(error);
    setLoading(false);
    return;
  }

  const reps = (data || []).map((rep) => ({
    ...rep,
    approve_count: rep.stat_approve_count || 0,
    disapprove_count: rep.stat_disapprove_count || 0,
    discussion_count: rep.stat_discussion_count || 0,
  }));

  setRepresentatives(reps);
  setLoading(false);
}

  async function fetchUserVotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_votes").select("representative_id, vote_type").eq("user_id", user.id);
    const map: Record<number, string> = {};
    (data || []).forEach((v: UserVote) => { map[v.representative_id] = v.vote_type; });
    setUserVotes(map);
  }

  async function handleVote(repId: number, voteType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (userVotes[repId] === voteType) return;

    setVotingId(repId);
    const result = userVotes[repId]
  ? await supabase
      .from("user_votes")
      .update({ vote_type: voteType })
      .eq("representative_id", repId)
      .eq("user_id", user.id)
      .select()
  : await supabase
      .from("user_votes")
      .insert({
        representative_id: repId,
        user_id: user.id,
        vote_type: voteType,
      })
      .select();

console.log("VOTE RESULT:", JSON.stringify(result, null, 2));
    setUserVotes((prev) => ({ ...prev, [repId]: voteType }));
    setVotingId(null);
    fetchRepresentatives();
  }

  async function handleSearchInput(
  val: string
) {
  setSearchQuery(val);

  if (val.length < 2) {
    setSuggestions([]);
    setShowSuggestions(false);

    fetchRepresentatives();

    return;
  }

  const { data, error } = await supabase
  .from("representatives_view")
  .select("*")
    .or(`name.ilike.%${val}%,title.ilike.%${val}%,state.ilike.%${val}%,city.ilike.%${val}%`)
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  setRepresentatives(data || []);

  setSuggestions(data || []);

  setShowSuggestions(true);
}


  const filtered = representatives.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      (r.city || "").toLowerCase().includes(q) ||
      (r.county || "").toLowerCase().includes(q) ||
      (r.zip_code || "").includes(q);
  
  const matchCat =
  searchQuery.length > 0
    ? true
    : selectedCategory === "all"
    ? true
    : selectedCategory === "state"
    ? r.category === "House" ||
      r.category === "Senate" ||
      r.title?.includes("Representative") ||
      r.title?.includes("Senator")
    : selectedCategory === "governor"
    ? r.title?.toLowerCase().includes("governor")
    : selectedCategory === "mayor"
    ? r.title?.toLowerCase().includes("mayor")
    : selectedCategory === "sheriff"
    ? r.title?.toLowerCase().includes("sheriff")
    : selectedCategory === "judge"
    ? r.title?.toLowerCase().includes("judge")
    : selectedCategory === "school_board"
    ? r.title?.toLowerCase().includes("school")
    : selectedCategory === "city_council"
    ? r.title?.toLowerCase().includes("council")
    : true;
    const stateAbbr =
  STATE_ABBR[selectedState] || selectedState;

const matchState =
  selectedState === "all" ||
  r.state === stateAbbr;
    return matchSearch && matchCat && matchState;
  });

  const sorted = [...filtered].sort(
    (a, b) =>
      (b.approve_count || 0) + (b.disapprove_count || 0) -
      ((a.approve_count || 0) + (a.disapprove_count || 0))
  );

  return (
    <main className="min-h-screen bg-black text-white pb-16 md:pb-0">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight shrink-0">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/representatives" className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Directory</Link>
            <Link href="/trending" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Trending</Link>
            <Link href="/polls" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Polls</Link>
          </div>
          <div className="flex items-center gap-3">
          
            <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
            <Link href="/representatives" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider py-2">Directory</Link>
            <Link href="/trending" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/polls" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Polls</Link>
            
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
            {filtered.length.toLocaleString()} entries
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none">
            REPRESENTATIVES<br />
            <span className="text-yellow-400">DIRECTORY</span>
          </h1>
        </div>

        {/* ── SEARCH ── */}
        <div ref={searchRef} className="relative mb-6">
          <div className="flex items-center border border-white/10 bg-white/[0.02] focus-within:border-yellow-400 transition">
            <svg className="w-4 h-4 text-gray-500 ml-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              placeholder="Search by official name..."
              className="w-full bg-transparent px-4 py-4 text-white placeholder-gray-600 outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                className="mr-4 text-gray-500 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 border border-white/10 border-t-0 bg-black shadow-2xl">
              {suggestions.map((s) => {
                const tagColor = CATEGORY_COLORS[s.category.toLowerCase()] ?? "bg-yellow-400 text-black";
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSearchQuery(s.name);
                      setShowSuggestions(false);
                      router.push(`/representatives/${s.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                  >
                    <span className={`text-xs font-black px-2 py-0.5 uppercase shrink-0 ${tagColor}`}>{s.category}</span>
                    <span className="text-white font-bold text-sm truncate">{s.name}</span>
                    <span className="text-gray-500 text-xs ml-auto shrink-0">{s.state}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={async () => {
  setSelectedCategory(cat.id);

  if (cat.id === "mayor") {
  setRepresentatives([
    {
      id: -1,
      name: "Mayors",
      title: "Mayors Coming Soon",
      state: "",
      category: "Mayors",
    },
  ]);
  return;
}

if (cat.id === "judge") {
  setRepresentatives([
    {
      id: -2,
      name: "Judges",
      title: "Judges Coming Soon",
      state: "",
      category: "Judges",
    },
  ]);
  return;
}

if (cat.id === "school_board") {
  setRepresentatives([
    {
      id: -3,
      name: "School Boards",
      title: "School Boards Coming Soon",
      state: "",
      category: "School Boards",
    },
  ]);
  return;
}

if (cat.id === "city_council") {
  setRepresentatives([
    {
      id: -4,
      name: "City Council",
      title: "City Council Coming Soon",
      state: "",
      category: "City Council",
    },
  ]);
  return;
}

  let query = supabase
  .from("representatives_view")
  .select("*");

  if (cat.id === "governor") {
    query = query.in("category", ["Governor", "Governors"]);
  } else if (cat.id === "state") {
    query = query.in("category", ["House", "Senate"]);
  } else if (cat.id === "sheriff") {
    query = query.in("category", ["Sheriff", "Sheriffs"]);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error(error);
    return;
  }

  setRepresentatives(data || []);
}}
                className={`shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wider border transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
        </div>

        {/* ── RESULTS COUNT ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            Showing <span className="text-white">{sorted.length}</span> results
            {selectedCategory !== "all" && (
              <> · <span className="text-yellow-400">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span></>
            )}
            
          </p>
          {(selectedCategory !== "all" || selectedState !== "all" || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory("all"); setSelectedState("all"); setSearchQuery(""); }}
              className="text-xs text-gray-500 hover:text-yellow-400 transition font-bold uppercase tracking-wider"
            >
              Clear filters ×
            </button>
          )}
        </div>

{/* ── CIVIC DATA EXPANDING NOTICE ── */}
<div className="mb-6 rounded-2xl border border-yellow-500 bg-yellow-400/15 p-4 shadow-lg">
  <div className="flex items-start gap-3">
    <div className="text-2xl shrink-0">🛠️</div>

    <div>
      <h3 className="text-lg font-bold text-yellow-300">
        Civic Data Expanding
      </h3>

      <p className="mt-1 text-sm text-yellow-100 leading-relaxed">
        Pulse50 is actively expanding representative, sheriff, and local
        government coverage across the United States. New officials and
        counties are added regularly, and updates are made often to ensure
        accuracy.
      </p>

      <p className="mt-2 text-sm font-medium text-yellow-200">
        If your local official is missing, check back soon — updates are
        continuing frequently.
      </p>
    </div>
  </div>
</div>

        {/* ── SUPABASE REPS SLIDER ── */}
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
            <p className="text-4xl font-black text-white/10 mb-4">No results</p>
            <p className="text-gray-600 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {sorted.map((rep) => (
                <div key={rep.id} className="snap-start shrink-0 w-[85vw] sm:w-[360px]">
                  <VoteCard
                    {...rep}
                    userVote={userVotes[rep.id]}
                    isVoting={votingId === rep.id}
                    onApprove={() => handleVote(rep.id, "approve")}
                    onDisapprove={() => handleVote(rep.id, "disapprove")}
                  />
                </div>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </div>
        )}

 </div>{/* ← closes max-w-7xl */}
       
      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-600 font-bold uppercase tracking-wider">
            <Link href="/trending" className="hover:text-yellow-400 transition">Trending</Link>
            <Link href="/polls" className="hover:text-yellow-400 transition">Polls</Link>
            <Link href="/login" className="hover:text-yellow-400 transition">Login</Link>
          </div>
          <p className="text-center text-xs text-gray-600">
            Public opinion platform. Not affiliated with any government entity.
          </p>
        </div>
      </footer>
            <MobileNav />
    </main>
  );
}

export default function RepresentativesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading Pulse50...
        </main>
      }
    >
      <RepresentativesContent />
    </Suspense>
  );
}