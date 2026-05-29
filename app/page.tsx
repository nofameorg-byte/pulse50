"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import ShareMenu from "./components/ShareMenu";
import MobileNav from "./components/MobileNav";

interface Representative {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  image_url: string;
  discussion_count: number;
  approve_count?: number;
  disapprove_count?: number;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState<Representative[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [totalStates, setTotalStates] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalDiscussions, setTotalDiscussions] = useState(0);

  useEffect(() => {
    fetchTrending();
    fetchStats();
  }, []);

  async function fetchStats() {
    // Total votes
    const { count: voteCount } = await supabase
      .from("user_votes")
      .select("*", { count: "exact", head: true });

    // Total reps
    const { count: repCount } = await supabase
      .from("representatives")
      .select("*", { count: "exact", head: true });

    // Unique states
    const { data: stateData } = await supabase
      .from("representatives")
      .select("state");
    const uniqueStates = new Set(stateData?.map((r) => r.state) || []);

    // Total comments
    const { count: commentCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    // Total discussions = distinct representative_ids that have at least one comment
    // TODO: if a dedicated discussions table is added later, swap this query
    const { data: discussionData } = await supabase
      .from("comments")
      .select("representative_id");
    const uniqueDiscussions = new Set(
      (discussionData || []).map((c) => c.representative_id)
    );

    setTotalVotes(voteCount || 0);
    setTotalReps(repCount || 0);
    setTotalStates(uniqueStates.size);
    setTotalComments(commentCount || 0);
    setTotalDiscussions(uniqueDiscussions.size);
  }

  async function fetchTrending() {
    const { data, error } = await supabase
      .from("representatives")
      .select("*")
      .limit(5);

    if (error) {
      console.error(error);
      return;
    }

    const updatedData = await Promise.all(
      (data || []).map(async (rep) => {
        const { count: discussions } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("representative_id", rep.id);

        const { data: voteData } = await supabase
          .from("user_votes")
          .select("vote_type")
          .eq("representative_id", rep.id);

        const approve = voteData?.filter((v) => v.vote_type === "approve").length || 0;
        const disapprove = voteData?.filter((v) => v.vote_type === "disapprove").length || 0;

        return {
          ...rep,
          discussion_count: discussions || 0,
          approve_count: approve,
          disapprove_count: disapprove,
        };
      })
    );

    setTrending(updatedData);
  }

  return (
    <main className="min-h-screen bg-black text-white pb-16 md:pb-0">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-3xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </div>
          {/* FIX #1 — Login button removed from desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {[
              { label: "Home", href: "/" },
              { label: "Representatives", href: "/representatives" },
              { label: "Discussions", href: "/representatives" },
              { label: "States", href: "/representatives" },
              { label: "Now", href: "/now" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-gray-400 transition hover:text-yellow-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        {/* Background glow */}
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/6 blur-3xl pointer-events-none" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400" />

        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center text-center">

          {/* ORIVOO Logo */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-2xl scale-150 pointer-events-none" />
            <img
              src="/orivoo-logo.png"
              alt="ORIVOO"
              className="relative h-48 md:h-64 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              Live Voting Open
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-7xl md:text-9xl font-black tracking-tight leading-none mb-3">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-400/80 mb-3">
            Powered by ORIVOO AI
          </p>

          {/* Tagline */}
          <p className="text-gray-400 text-lg font-medium mb-10">
            Track. Learn. Participate.
          </p>

          {/* FIX #2 — Hero stats wired to real Supabase data (totalReps, totalStates) */}
          <div className="flex items-center gap-10 mb-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-yellow-400">
                <AnimatedCounter target={totalReps} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Representatives Tracked
              </span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black text-yellow-400">
                <AnimatedCounter target={totalStates} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                States Covered
              </span>
            </div>
          </div>

         {/* Buttons */}
<div className="flex justify-center mb-14">
  <button
    onClick={() => router.push("/login")}
    className="px-10 py-4 bg-yellow-400 text-black font-black text-sm uppercase tracking-wider hover:bg-yellow-300 transition"
  >
    Get Started
  </button>
</div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">

            {/* Card 1 — Representatives */}
            <div className="border border-white/10 bg-white/[0.02] hover:border-yellow-400/50 transition p-6 flex flex-col gap-4 group">
              <div className="text-3xl">🏛</div>
              <div>
                <h3 className="text-white font-black text-lg mb-1">Representatives</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Find and track public officials across America.
                </p>
              </div>
              <button
                onClick={() => router.push("/representatives")}
                className="mt-auto w-full py-3 border border-yellow-400/40 text-yellow-400 font-black text-xs uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition"
              >
                Explore Representatives
              </button>
            </div>

            {/* Card 2 — Pulse50 Now */}
            <div className="border border-white/10 bg-white/[0.02] hover:border-yellow-400/50 transition p-6 flex flex-col gap-4 group">
              <div className="text-3xl">📰</div>
              <div>
                <h3 className="text-white font-black text-lg mb-1">Pulse50 Now</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Follow civic media, hearings, public events, and community coverage.
                </p>
              </div>
              <button
                onClick={() => router.push("/now")}
                className="mt-auto w-full py-3 border border-yellow-400/40 text-yellow-400 font-black text-xs uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition"
              >
                Open Pulse50 Now
              </button>
            </div>

           {/* Card 3 — Public Pulse */}
<div className="border border-yellow-400/20 bg-yellow-400/[0.03] hover:border-yellow-400/60 transition p-6 flex flex-col gap-4 group relative overflow-hidden">
  <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400/40 group-hover:bg-yellow-400 transition" />
  <div className="text-3xl">📊</div>
  <div>
    <h3 className="text-white font-black text-lg mb-1">Public Pulse</h3>
    <p className="text-gray-400 text-sm leading-relaxed">
      See what America is talking about right now. Track trending politicians, approval ratings, public discussions, civic engagement, and real-time activity across the platform.
    </p>
  </div>
  <button
    onClick={() => router.push("/trending")}
    className="mt-auto w-full py-3 bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 font-black text-xs uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition"
  >
    Open Public Pulse
  </button>
</div>

          </div>
        </div>
      </section>

      {/* ── CIVIC DATA EXPANDING NOTICE ── */}
      <div className="mx-auto max-w-7xl px-6 mb-5">
        <div className="border border-yellow-500/40 bg-yellow-500/10 p-4 rounded-sm">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-lg">⚡</span>
            <div>
              <h3 className="text-yellow-400 font-black text-sm uppercase tracking-wider">
                Civic Data Expanding
              </h3>
              <p className="text-yellow-200/90 text-sm leading-relaxed mt-1">
                Pulse50 is actively expanding representative, sheriff, and local
                government coverage across the United States. New officials and counties
                are added regularly to improve accuracy.
              </p>
              <p className="text-yellow-300 text-xs font-semibold mt-2">
                If your local official is missing, check back soon — updates are continuing frequently.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BANNER ── */}
      {/* FIX #3 — replaced Politicians Tracked + States Represented with Comments Posted + Discussions Created */}
      <section className="border-y border-white/10 bg-white/[0.02] py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl font-black text-yellow-400">
                <AnimatedCounter target={totalVotes} suffix="+" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Total Votes Cast
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl font-black text-yellow-400">
                <AnimatedCounter target={totalComments} />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Comments Posted
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl font-black text-yellow-400">
                <AnimatedCounter target={totalDiscussions} />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Discussions Created
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="px-6 py-24 bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                Real-Time Activity
              </p>
              <h2 className="text-5xl font-black">
                Trending On{" "}
                <span className="text-yellow-400">Pulse50</span>
              </h2>
              <p className="mt-3 text-gray-400">
                Public approval and discussion happening right now.
              </p>
            </div>
            <Link
              href="/representatives"
              className="inline-block border border-yellow-400 px-6 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              View All Representatives →
            </Link>
          </div>

          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {trending.map((rep) => {
                const total = (rep.approve_count || 0) + (rep.disapprove_count || 0);
                const approvalPct =
                  total > 0 ? Math.round(((rep.approve_count || 0) / total) * 100) : 0;
                const disapprovalPct = total > 0 ? 100 - approvalPct : 0;
                const statsText = `${approvalPct}% approval · ${total.toLocaleString()} votes`;

                return (
                  <div
                    key={rep.id}
                    className="snap-start shrink-0 w-[85vw] sm:w-[360px] lg:w-[340px] border border-white/10 bg-white/[0.02] p-6 relative group hover:border-yellow-400 transition flex flex-col"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="bg-yellow-400 text-black text-xs font-black px-3 py-1 uppercase tracking-wider">
                        {rep.category}
                      </span>
                      <span className="border border-white/20 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
                        {rep.state}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight">{rep.name}</h3>
                    <p className="text-gray-400 mt-1 text-sm mb-6">{rep.title}</p>
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Approval Rating</span>
                        <span className="text-xl font-black text-yellow-400">{approvalPct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10">
                        <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${approvalPct}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-yellow-400 font-bold">
                          {(rep.approve_count || 0).toLocaleString()} approve · {approvalPct}%
                        </span>
                        <span className="text-red-400 font-bold">
                          {disapprovalPct}% · {(rep.disapprove_count || 0).toLocaleString()} disapprove
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-5 mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Discussions</span>
                        <span className="text-2xl font-black text-white">{rep.discussion_count || 0}</span>
                      </div>
                      <ShareMenu url={`/representatives/${rep.id}`} title={rep.name} stats={statsText} />
                    </div>
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => router.push(`/representatives/${rep.id}`)}
                        className="flex-1 py-3 bg-yellow-400 text-black font-black text-sm uppercase tracking-wider hover:bg-yellow-300 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => router.push(`/representatives/${rep.id}`)}
                        className="flex-1 py-3 border border-red-500/40 text-red-400 font-black text-sm uppercase tracking-wider hover:bg-red-500/10 transition"
                      >
                        Disapprove
                      </button>
                    </div>
                    <Link
                      href={`/representatives/${rep.id}`}
                      className="mt-3 block w-full border border-white/10 py-3 text-center text-sm font-bold text-white hover:border-yellow-400 hover:text-yellow-400 transition"
                    >
                      View Discussion →
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
              Simple Process
            </p>
            <h2 className="text-5xl font-black text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10">
            {[
              {
                num: "01",
                title: "Find",
                desc: "Search any politician by name, party, or state. Browse the full directory of tracked officials.",
              },
              {
                num: "02",
                title: "Vote",
                desc: "Cast your approval or disapproval. One person, one vote — your voice carries equal weight.",
              },
              {
                num: "03",
                title: "See the Results",
                desc: "Watch live tallies update in real time. Track trends, compare candidates, and share the data.",
              },
            ].map(({ num, title, desc }, i) => (
              <div key={num} className={`p-10 ${i < 2 ? "border-r border-white/10" : ""}`}>
                <div className="text-8xl font-black text-yellow-400/15 leading-none mb-4 select-none">
                  {num}
                </div>
                <h3 className="text-2xl font-black text-white mb-3">{title}.</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24 bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">
              Your Voice Matters
            </p>
            <h2 className="text-6xl font-black text-white leading-none mb-6">
              MAKE IT
              <br />
              <span className="text-yellow-400">COUNT.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
              Join millions of Americans holding their representatives accountable.
            </p>
            <button
              onClick={() => router.push("/representatives")}
              className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 text-black font-black text-sm uppercase tracking-wider hover:bg-yellow-300 transition"
            >
              Cast Your Vote Now →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-black px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="text-3xl font-black mb-4">
                <span className="text-white">Pulse</span>
                <span className="text-yellow-400">50</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                The public pulse of America. Real votes. Real data. Real accountability.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  Live Voting Open
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                Platform
              </h4>
              <nav className="flex flex-col gap-3">
                {["Representatives", "Discussions", "States", "Leaderboard"].map((l) => (
                  <Link
                    key={l}
                    href="/representatives"
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {l}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                Legal
              </h4>
              <nav className="flex flex-col gap-3">
                {["Privacy Policy", "Terms of Use", "About Pulse50"].map((l) => (
                  <Link
                    key={l}
                    href="/"
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {l}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Pulse50. Not affiliated with any political party or
              government entity.
            </p>
            <p className="text-xs text-gray-600">
              Pulse50 is a public opinion platform and does not represent official election results.
            </p>
            <Link
              href="/admin"
              className="text-gray-800 hover:text-yellow-400 transition text-xs"
            >
              🔒
            </Link>
          </div>
        </div>
      </footer>
      <MobileNav />
    </main>
  );
}