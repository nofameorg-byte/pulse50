"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShareMenu from "./ShareMenu";
import { CATEGORY_COLORS } from "../lib/constants";
import { supabase } from "../lib/supabase";

interface VoteCardProps {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  city?: string;
  approve_count?: number;
  disapprove_count?: number;
  discussion_count?: number;
  share_count?: number;
  userVote?: string | null;
  isVoting?: boolean;
  onApprove?: () => void;
  onDisapprove?: () => void;
}

export default function VoteCard({
  id, name, title, state, category, city,
  approve_count = 0, disapprove_count = 0, discussion_count = 0,
  share_count,
  userVote, isVoting, onApprove, onDisapprove,
}: VoteCardProps) {
  const [shareCount, setShareCount] = useState<number>(share_count ?? 0);

  // Fetch live share count if not passed as prop
  useEffect(() => {
    if (share_count !== undefined) return;
    supabase
      .from("shares")
      .select("*", { count: "exact", head: true })
      .eq("representative_id", id)
      .then(({ count }) => setShareCount(count || 0));
  }, [id, share_count]);

  // Real-time share count updates
  useEffect(() => {
    const channel = supabase
      .channel(`shares-card-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shares", filter: `representative_id=eq.${id}` },
        () => setShareCount((prev) => prev + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const total = approve_count + disapprove_count;
  const approvalPct = total > 0 ? Math.round((approve_count / total) * 100) : 0;
  const disapprovalPct = total > 0 ? 100 - approvalPct : 0;

  const tagColor = CATEGORY_COLORS[category.toLowerCase()] ?? "bg-yellow-400 text-black";
  const statsText = `${approvalPct}% approval · ${total.toLocaleString()} votes`;

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6 relative group hover:border-yellow-400 transition flex flex-col h-full">
      {/* Gold hover accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-black px-3 py-1 uppercase tracking-wider ${tagColor}`}>
          {category}
        </span>
        <span className="border border-white/20 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
          {state}
        </span>
        {city && (
          <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">{city}</span>
        )}
      </div>

      {/* Name & title */}
      <h2 className="text-xl font-black text-white leading-tight">{name}</h2>
      <p className="text-gray-400 mt-1 text-sm mb-5">{title}</p>

      {/* Approval bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Approval</span>
          <span className="text-lg font-black text-yellow-400">{approvalPct}%</span>
        </div>
        <div className="h-1.5 bg-white/10">
          <div
            className="h-full bg-yellow-400 transition-all duration-700"
            style={{ width: `${approvalPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs">
          <span className="text-yellow-400 font-bold">
            {approve_count.toLocaleString()} · {approvalPct}%
          </span>
          <span className="text-red-400 font-bold">
            {disapprovalPct}% · {disapprove_count.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats row: discussions + shares + share button */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Discussions */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-black text-white">{discussion_count}</span>
          </div>
          {/* Shares */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="text-sm font-black text-white">{shareCount}</span>
          </div>
        </div>
        <ShareMenu
          url={`/representatives/${id}`}
          title={name}
          stats={statsText}
          representativeId={id}
        />
      </div>

      {/* Vote buttons */}
      <div className="flex gap-3 mt-auto">
        <button
          onClick={onApprove}
          disabled={isVoting}
          className={`flex-1 py-3 font-black text-sm uppercase tracking-wider transition disabled:opacity-50 ${
            userVote === "approve"
              ? "bg-green-500 text-black"
              : "bg-yellow-400 hover:bg-yellow-300 text-black"
          }`}
        >
          {userVote === "approve" ? "✓ Approved" : "Approve"}
        </button>
        <button
          onClick={onDisapprove}
          disabled={isVoting}
          className={`flex-1 py-3 font-black text-sm uppercase tracking-wider border transition disabled:opacity-50 ${
            userVote === "disapprove"
              ? "bg-red-500 border-red-500 text-white"
              : "border-red-500/40 text-red-400 hover:bg-red-500/10"
          }`}
        >
          {userVote === "disapprove" ? "✓ Disapproved" : "Disapprove"}
        </button>
      </div>

      {/* View Discussion */}
      <Link
        href={`/representatives/${id}`}
        className="mt-3 block w-full border border-white/10 py-3 text-center text-sm font-bold text-white hover:border-yellow-400 hover:text-yellow-400 transition"
      >
        View Discussion →
      </Link>
    </div>
  );
}
