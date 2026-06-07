"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Star, Mail, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Label color map ───────────────────────────────────────────────────────────
const LABEL_COLORS: Record<string, string> = {
  Campaign:           "border-purple-500/50 text-purple-300 bg-purple-500/15",
  MAGA:               "border-red-500/50 text-red-400 bg-red-500/15",
  "Black Lives Matter": "border-blue-500/50 text-blue-300 bg-blue-500/15",
  Infrastructure:     "border-yellow-500/50 text-yellow-400 bg-yellow-500/15",
  Crime:              "border-red-400/50 text-red-300 bg-red-400/15",
  Education:          "border-cyan-500/50 text-cyan-400 bg-cyan-500/15",
  Economy:            "border-green-500/50 text-green-400 bg-green-500/15",
  "Public Safety":    "border-orange-500/50 text-orange-400 bg-orange-500/15",
  Government:         "border-gray-400/50 text-gray-300 bg-gray-400/15",
  Housing:            "border-sky-500/50 text-sky-300 bg-sky-500/15",
};

function labelClass(label: string): string {
  return LABEL_COLORS[label] ?? "border-white/20 text-gray-400 bg-white/5";
}

// ── Pulse score ───────────────────────────────────────────────────────────────
function calcPulseScore(support: number, unsupport: number, views: number): number {
  const total = support + unsupport;
  const supportPct = total > 0 ? (support / total) * 100 : 50;
  return Math.min(Math.round(supportPct * 0.4 + Math.min(views / 500, 20) + 20), 100);
}

// ── Support meter ─────────────────────────────────────────────────────────────
function SupportMeter({ support, unsupport }: { support: number; unsupport: number }) {
  const total = support + unsupport;
  const pct = total > 0 ? Math.round((support / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-yellow-400">Support {pct}%</span>
        <span className="text-gray-500">Unsupport {100 - pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 flex overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="h-full bg-white/20 transition-all duration-700"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </div>
  );
}

// ── PulseScore badge ──────────────────────────────────────────────────────────
function PulseScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
      : score >= 60
      ? "text-orange-400 border-orange-400/40 bg-orange-400/10"
      : "text-gray-400 border-white/10 bg-white/5";
  return (
    <div className={`flex items-center gap-1 border px-2 py-0.5 text-xs font-black ${color}`}>
      <Star className="w-3 h-3" />
      <span>PulseScore {score}</span>
    </div>
  );
}

// ── Video card ────────────────────────────────────────────────────────────────
function VideoCard({ video }: { video: CivicVideo }) {
  const [supported, setSupported] = useState<"support" | "unsupport" | null>(null);
  const [localSupport, setLocalSupport] = useState(video.support_count);
  const [localUnsupport, setLocalUnsupport] = useState(video.unsupport_count);
  const [showVideo, setShowVideo] = useState(false);
  

  const pulseScore = calcPulseScore(localSupport, localUnsupport, video.view_count);

  async function handleSupport(type: "support" | "unsupport") {
    if (supported === type) return;
    const newSupport =
      type === "support"
        ? localSupport + 1
        : supported === "support"
        ? localSupport - 1
        : localSupport;
    const newUnsupport =
      type === "unsupport"
        ? localUnsupport + 1
        : supported === "unsupport"
        ? localUnsupport - 1
        : localUnsupport;
    setLocalSupport(newSupport);
    setLocalUnsupport(newUnsupport);
    setSupported(type);
    await supabase
      .from("civic_videos")
      .update({ support_count: newSupport, unsupport_count: newUnsupport })
      .eq("id", video.id);
  }

  // Deterministic date — no toLocaleDateString (prevents hydration mismatch)
  const datePart = video.created_at.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedDate = `${MONTHS[month - 1]} ${day}, ${year}`;

  const viewLabel =
    video.view_count >= 1000
      ? `${(video.view_count / 1000).toFixed(1)}K`
      : String(video.view_count);

  const location = [video.county, video.state_abbr].filter(Boolean).join(", ");
  const isTrending = localSupport + localUnsupport >= 500;

  return (
    <div className="border border-white/10 bg-white/[0.02] hover:border-yellow-400/50 transition group flex flex-col relative overflow-hidden">
      {/* Gold top line on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Thumbnail */}
      <div
        className="relative w-full bg-black overflow-hidden cursor-pointer"
        style={{ aspectRatio: "16/9" }}
        onClick={() => setShowVideo(true)}
      >
        {showVideo ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`}
            title={video.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition"
            />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Trending badge */}
            {isTrending && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse inline-block" />
                Trending
              </div>
            )}
            {/* View count */}
            {video.view_count > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewLabel}
              </div>
            )}
          </>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Labels */}
        {video.labels && video.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.labels.map((label) => (
              <span
                key={label}
                className={`border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${labelClass(label)}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-white font-black text-base leading-snug line-clamp-2 flex-1">
          {video.title}
        </h3>

        {/* Location + date */}
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">{location}</p>
          <span className="text-gray-600 text-xs">{formattedDate}</span>
        </div>

        {/* Support meter */}
        <SupportMeter support={localSupport} unsupport={localUnsupport} />

        {/* Pulse score + vote count */}
        <div className="flex items-center justify-between">
          <PulseScoreBadge score={pulseScore} />
          <span className="text-gray-600 text-xs">
            {(localSupport + localUnsupport).toLocaleString()} votes
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1">
          <button
            onClick={() => handleSupport("support")}
            className={`py-1.5 text-xs font-black uppercase tracking-wider transition ${
              supported === "support"
                ? "bg-yellow-400 text-black"
                : "border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            Support
          </button>
          <button
            onClick={() => handleSupport("unsupport")}
            className={`py-1.5 text-xs font-black uppercase tracking-wider transition ${
              supported === "unsupport"
                ? "bg-white/20 text-white border border-white/20"
                : "border border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
            }`}
          >
            Unsupport
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Trending strip ────────────────────────────────────────────────────────────
function TrendingStrip({ videos }: { videos: CivicVideo[] }) {
  const top5 = [...videos]
    .sort((a, b) => {
      const scoreA = calcPulseScore(a.support_count, a.unsupport_count, a.view_count);
      const scoreB = calcPulseScore(b.support_count, b.unsupport_count, b.view_count);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  if (top5.length === 0) return null;

  return (
    <section className="border border-yellow-400/20 bg-yellow-400/[0.03] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
      <div className="px-4 md:px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {top5.map((v, i) => {
            const total = v.support_count + v.unsupport_count;
            const pct = total > 0 ? Math.round((v.support_count / total) * 100) : 0;
            const score = calcPulseScore(v.support_count, v.unsupport_count, v.view_count);
            const location = [v.county, v.state_abbr].filter(Boolean).join(", ");
            return (
              <div key={v.id} className="flex items-start gap-2 group">
                <span className="text-yellow-400/50 font-black text-2xl leading-none shrink-0 w-6">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-black leading-snug line-clamp-2 group-hover:text-yellow-400 transition">
                    {v.title}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">{location}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-white/10">
                      <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-yellow-400 text-xs font-black shrink-0">{score}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ videos }: { videos: CivicVideo[] }) {
  const mostSupported = [...videos]
    .sort((a, b) => b.support_count - a.support_count)
    .slice(0, 5);

  const newest = [...videos]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <aside className="space-y-5">

      {/* Most Supported */}
      <div className="border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-3">
          Most Supported
        </h3>
        <div className="space-y-3">
          {mostSupported.map((v) => {
            const total = v.support_count + v.unsupport_count;
            const pct = total > 0 ? Math.round((v.support_count / total) * 100) : 0;
            const location = [v.county, v.state_abbr].filter(Boolean).join(", ");
            return (
              <div key={v.id} className="space-y-1">
                <p className="text-white text-xs font-bold leading-snug line-clamp-1">{v.title}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-yellow-400 text-xs font-black shrink-0">{pct}%</span>
                </div>
                <p className="text-gray-600 text-xs">{location}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Newest Uploads */}
      <div className="border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-3">
          Newest Uploads
        </h3>
        <div className="space-y-3">
          {newest.map((v) => {
            const datePart = v.created_at.split("T")[0];
            const [yr, mo, dy] = datePart.split("-").map(Number);
            const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const fd = `${MONTHS[mo - 1]} ${dy}, ${yr}`;
            return (
              <div key={v.id} className="flex items-start gap-2 group">
                <div className="w-1 h-1 rounded-full bg-yellow-400/40 mt-1.5 shrink-0" />
                <div>
                  <p className="text-white text-xs font-bold leading-snug group-hover:text-yellow-400 transition line-clamp-2">
                    {v.title}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{fd}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit CTA */}
      <div className="border border-yellow-400/20 bg-yellow-400/[0.03] p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400/40" />
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-3.5 h-3.5 text-yellow-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Submit a Story
          </h3>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-3">
          See something happening in your community? Send us a video.
        </p>
        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <p>• 0–3 minute videos only</p>
          <p>• Include your state and county</p>
          <p>• Describe the issue briefly</p>
          <p>• No personal attacks or harassment</p>
        </div>
        <a
          href="mailto:nofameorg@gmail.com"
          className="flex items-center justify-center gap-2 w-full py-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition"
        >
          <Mail className="w-3.5 h-3.5" />
          Submit Video
        </a>
        <p className="text-gray-700 text-xs text-center mt-2">nofameorg@gmail.com</p>
      </div>

    </aside>
  );
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function Pulse50NowPage() {
  const [videos, setVideos] = useState<CivicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("civic_videos")
        .select("*")
        .eq("enabled", true)
        .order("position", { ascending: true });
      if (!error) setVideos(data ?? []);
      setLoading(false);
    }
    load();
  }, []);



  const filtered = videos;

  const totalVotes = videos.reduce(
    (acc, v) => acc + v.support_count + v.unsupport_count,
    0
  );
  const trendingCount = videos.filter(
    (v) => v.support_count + v.unsupport_count >= 500
  ).length;

  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden">


      {/* ── NAV ── */}
<nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
    <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight">
      <span className="text-white">Pulse</span>
      <span className="text-yellow-400">50</span>
      <span className="ml-2 text-xs uppercase tracking-widest text-yellow-400/80">
        NOW
      </span>
    </Link>

    <div className="hidden md:flex items-center gap-6">
      <Link
        href="/representatives"
        className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider"
      >
        Representatives
      </Link>

      <Link
        href="/trending"
        className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider"
      >
        Trending
      </Link>

      <Link
        href="/"
        className="border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition"
      >
        Home
      </Link>
    </div>

    <button
      className="md:hidden p-2 text-gray-400 hover:text-white"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {mobileMenuOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  </div>

  {mobileMenuOpen && (
    <div className="md:hidden border-t border-white/10 bg-black px-4 py-6">
      <div className="grid grid-cols-2 gap-y-6">
        <Link href="/representatives" className="text-xl font-black uppercase tracking-wider text-gray-400">
          Directory
        </Link>

        <Link href="/trending" className="text-xl font-black uppercase tracking-wider text-gray-400">
          Trending
        </Link>

        <Link href="/now" className="text-xl font-black uppercase tracking-wider text-yellow-400">
          PulseNow
        </Link>

        <Link href="/now/townhall" className="text-xl font-black uppercase tracking-wider text-gray-400">
          TownHall
        </Link>

        <Link href="/polls" className="text-xl font-black uppercase tracking-wider text-gray-400">
          Polls
        </Link>

        <Link href="/login" className="text-xl font-black uppercase tracking-wider text-gray-400">
          Account
        </Link>
      </div>
    </div>
  )}
</nav>

{/* ── HERO ── */}
      <section className="relative z-10 border-b border-white/10 px-4 md:px-6 py-12 md:py-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-400" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
              Community Submitted · Pulse50 Reviewed
            </p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-none mb-2">
            PULSE50
            <br />
            <span className="text-yellow-400">NOW</span>
          </h1>
          <p className="text-2xl md:text-3xl font-black text-white/60 mb-4 italic">
            "The Voice of the People."
          </p>
          <p className="max-w-2xl text-gray-400 text-base leading-relaxed mb-6">
            What is happening in your community? Watch, support, and discuss real issues
            from citizens across America — infrastructure, schools, safety, housing, and more.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-600">
            <span>{videos.length} video{videos.length !== 1 ? "s" : ""}</span>
            <span className="w-px h-4 bg-white/10" />
            {trendingCount > 0 && (
              <>
                <span>{trendingCount} trending</span>
                <span className="w-px h-4 bg-white/10" />
              </>
            )}
            <span>{totalVotes.toLocaleString()} community votes</span>
            <span className="w-px h-4 bg-white/10" />
            <Link href="/" className="text-yellow-400 hover:underline">← Back to Pulse50</Link>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Video grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
  All Issues
</p>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {loading ? "Loading..." : `${filtered.length} Video${filtered.length !== 1 ? "s" : ""}`}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Live Feed
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-white/10 bg-white/[0.02] animate-pulse"
                    style={{ aspectRatio: "3/4" }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="border border-white/10 bg-white/[0.02] p-16 text-center">
                {videos.length === 0 ? (
                  <>
                    <p className="text-3xl font-black text-white/10 mb-2">No Videos Yet</p>
                    <p className="text-gray-600 text-sm">Check back soon.</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-lg font-bold">
  No videos available.
</p>
                    <p className="text-gray-700 text-sm mt-2">
  Check back soon.
</p>
                  </>
                )}
              </div>
            ) : (
  <div className="overflow-x-auto pb-4">
  <div className="flex gap-5">
    {filtered.map((video) => (
      <div
        key={video.id}
         className="w-[320px] sm:w-[360px] md:w-[420px] flex-shrink-0"
      >
        <VideoCard video={video} />
      </div>
    ))}
  </div>
</div>
)}
<div className="mt-6 border border-yellow-400/20 bg-yellow-400/[0.03] p-5">
  <h3 className="text-yellow-400 text-sm font-black uppercase tracking-widest mb-2">
    Join TownHall
  </h3>

  <p className="text-gray-500 text-sm mb-4">
    Discuss the issues you see in Pulse50 Now.
  </p>

  <Link
    href="/now/townhall"
    className="inline-flex bg-yellow-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-yellow-300 transition"
  >
    Join TownHall
  </Link>
</div>



</div>
          {/* Sidebar — below feed on mobile, right column on desktop */}
{!loading && videos.length > 0 && (
  <div className="w-full xl:w-64 xl:shrink-0">
  <Sidebar videos={videos} />
</div>
)}

        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 bg-black px-6 py-10 mt-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-xl font-black">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-yellow-400">NOW</span>
          </div>
          <p className="text-xs text-gray-600 text-center max-w-md">
            Community voice civic media. Real issues. Real citizens. Real America.
            Pulse50 Now is a public platform and does not represent official government positions.
          </p>
          <Link
            href="/"
            className="text-xs text-gray-600 hover:text-yellow-400 transition font-bold uppercase tracking-wider"
          >
            ← Back to Pulse50
          </Link>
        </div>
      </footer>

    </main>
  );
}
