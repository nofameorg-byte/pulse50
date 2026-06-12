"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";


type TownHallPost = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  hidden?: boolean;
};

export default function NowTownHallPage() {
  const [posts, setPosts] = useState<TownHallPost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
  loadPosts();

  const channel = supabase
    .channel("townhall-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "now_townhall_posts",
      },
      () => loadPosts()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function loadPosts() {
    const { data, error } = await supabase
  .from("now_townhall_posts")
  .select("*")
  .eq("hidden", false)
  .order("created_at", { ascending: false });

    if (!error) {
      setPosts(data || []);
    }

    setLoading(false);
  }

  async function createPost() {
    if (!content.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login to join the TownHall.");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("now_townhall_posts").insert({
      user_id: user.id,
      content: content.trim(),
    });

    setPosting(false);

    if (error) {
      console.error(error);
      alert("Failed to post.");
      return;
    }

    setContent("");
    loadPosts();
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">

  {/* TownHall Background */}
  <div
    className="absolute inset-0 bg-cover bg-center opacity-35"
    style={{
      backgroundImage: "url('/townhall-bg.jpg')",
    }}
  />

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-black/85" />

  {/* Content Layer */}
  <div className="relative z-10">
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
      <Link href="/now" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
        PulseNow
      </Link>
      <Link href="/now/townhall" className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
        TownHall
      </Link>
      <Link href="/polls" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">
        Polls
      </Link>
    </div>

    <button
      className="md:hidden p-2 text-gray-400 hover:text-white"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {mobileMenuOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

        <Link href="/now" className="text-xl font-black uppercase tracking-wider text-gray-400">
          PulseNow
        </Link>

        <Link href="/now/townhall" className="text-xl font-black uppercase tracking-wider text-yellow-400">
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

      

      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400 mb-4 text-center">
  Pulse50 Now
</p>

          <h1 className="text-5xl md:text-7xl font-black leading-none mb-4">
            TOWN<span className="text-yellow-400">HALL</span>
          </h1>

          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
  Join citizens from across America in public discussion, debate,
  community concerns, civic issues, government accountability,
  and the topics shaping your community.
</p>

<h1 className="text-4xl md:text-4xl font-black text-white mb-4 text-center">
  YOUR VOICE
  <br />
  <span className="text-yellow-300">YOUR COMMUNITY</span>
  <br />
  YOUR FUTURE
</h1>


        </div>

        <div className="border border-yellow-400/20 bg-yellow-400/[0.03] p-5 mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about the Pulse50 Now videos..."
            className="w-full min-h-[120px] bg-black border border-white/10 p-4 text-white text-sm outline-none focus:border-yellow-400/50"
          />

          <div className="flex justify-between items-center mt-4 gap-4">
            <p className="text-xs text-yellow-400 font-semibold">
              Keep it respectful. Talk about the issue, not personal attacks.
            </p>

            <button
              onClick={createPost}
              disabled={posting}
              className="bg-yellow-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>


<div className="flex justify-center items-center gap-2 mb-8">
  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
  <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
    Live Public Discussion
  </span>
</div>

        {loading ? (
          <p className="text-gray-600">Loading TownHall...</p>
        ) : posts.length === 0 ? (
          <div className="border border-white/10 p-10 text-center">
            <p className="text-2xl font-black text-white/10 mb-2">
              No TownHall posts yet
            </p>
            <p className="text-gray-600 text-sm">
              Be the first to start the discussion.
            </p>
          </div>
        ) : (
          <div className="max-h-[700px] overflow-y-auto pr-2 space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-white/10 bg-black/70 backdrop-blur-sm p-5"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-yellow-400 text-xs font-black uppercase tracking-wider">
                    Citizen
                  </p>

                  <p className="text-gray-600 text-xs">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        )}
       </div>

    </div>

</main>
 
);
}