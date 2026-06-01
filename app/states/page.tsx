"use client";

import { useState } from "react";
import Link from "next/link";
import MobileNav from "../components/MobileNav";

const POLLS = [
  {
    id: 1,
    question: "Should Congress ban stock trading?",
    standBy: 61,
    walkAway: 39,
    totalVotes: 24381,
  },
  {
    id: 2,
    question: "Should schools allow cell phones?",
    standBy: 34,
    walkAway: 66,
    totalVotes: 18904,
  },
  {
    id: 3,
    question: "Should term limits be expanded?",
    standBy: 78,
    walkAway: 22,
    totalVotes: 31207,
  },
  {
    id: 4,
    question: "Should local governments livestream meetings?",
    standBy: 85,
    walkAway: 15,
    totalVotes: 14562,
  },
  {
    id: 5,
    question: "Should elected officials disclose finances yearly?",
    standBy: 91,
    walkAway: 9,
    totalVotes: 22419,
  },
  {
    id: 6,
    question: "Should AI be regulated by Congress?",
    standBy: 57,
    walkAway: 43,
    totalVotes: 16369,
  },
];

const LIFETIME_VOTES = 127842;

export default function PulsePollsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Track user selections per poll: null | "standby" | "walkaway"
  const [selections, setSelections] = useState<Record<number, "standby" | "walkaway" | null>>({});

  function handleVote(pollId: number, choice: "standby" | "walkaway") {
    setSelections((prev) => ({
      ...prev,
      [pollId]: prev[pollId] === choice ? null : choice,
    }));
  }

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
            <Link href="/now" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Now</Link>
            <Link href="/states" className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Polls</Link>
          </div>
          <button
            className="md:hidden p-2 text-gray-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black px-4 py-4 space-y-3">
            <Link href="/representatives" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Directory</Link>
            <Link href="/trending" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Trending</Link>
            <Link href="/now" className="block text-sm font-bold text-gray-400 uppercase tracking-wider py-2">Now</Link>
            <Link href="/states" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider py-2">Polls</Link>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">

        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
            The People Decide
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6">
            PULSE<br />
            <span className="text-yellow-400">POLLS</span>
          </h1>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-stretch border border-yellow-400/20 bg-yellow-400/[0.03] relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
            <div className="px-6 py-4">
              <div className="text-3xl md:text-4xl font-black text-yellow-400">
                {LIFETIME_VOTES.toLocaleString()}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                Lifetime Votes Cast
              </p>
            </div>
            <div className="h-px sm:h-auto sm:w-px bg-yellow-400/20" />
            <div className="px-6 py-4">
              <div className="text-3xl md:text-4xl font-black text-yellow-400">
                {POLLS.length}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                Active Polls
              </p>
            </div>
          </div>
        </div>

        {/* Poll grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {POLLS.map((poll) => {
            const selected = selections[poll.id] ?? null;
            return (
              <PollCard
                key={poll.id}
                poll={poll}
                selected={selected}
                onVote={(choice) => handleVote(poll.id, choice)}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
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

      <MobileNav />
    </main>
  );
}

// ── Poll Card ─────────────────────────────────────────────────────────────────
interface PollCardProps {
  poll: typeof POLLS[number];
  selected: "standby" | "walkaway" | null;
  onVote: (choice: "standby" | "walkaway") => void;
}

function PollCard({ poll, selected, onVote }: PollCardProps) {
  const standByPct = poll.standBy;
  const walkAwayPct = poll.walkAway;

  return (
    <div className="border border-white/10 bg-white/[0.02] flex flex-col relative overflow-hidden group hover:border-yellow-400/30 transition">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Placeholder image */}
      <div className="w-full aspect-video bg-white/[0.03] border-b border-white/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent" />
        <div className="text-center px-4">
          <div className="text-4xl font-black text-white/5 leading-none select-none">
            POLL
          </div>
        </div>
        {/* Poll number badge */}
        <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 uppercase tracking-wider">
          #{poll.id}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Question */}
        <h3 className="text-white font-black text-base leading-snug flex-1">
          {poll.question}
        </h3>

        {/* Vote bar */}
        <div className="h-1.5 bg-white/10 flex overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-700"
            style={{ width: `${standByPct}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-700"
            style={{ width: `${walkAwayPct}%` }}
          />
        </div>

        {/* Percentages */}
        <div className="flex justify-between text-xs font-black uppercase tracking-wider">
          <span className="text-yellow-400">{standByPct}% Stand By</span>
          <span className="text-red-400">{walkAwayPct}% Walk Away</span>
        </div>

        {/* Total votes */}
        <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
          {poll.totalVotes.toLocaleString()} votes
        </p>

        {/* Vote buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onVote("standby")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border transition ${
              selected === "standby"
                ? "bg-yellow-400 text-black border-yellow-400"
                : "border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            Stand By
          </button>
          <button
            onClick={() => onVote("walkaway")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border transition ${
              selected === "walkaway"
                ? "bg-red-500 text-white border-red-500"
                : "border-red-500/30 text-red-400 hover:bg-red-500/10"
            }`}
          >
            Walk Away
          </button>
        </div>
      </div>
    </div>
  );
}
