"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { US_STATES } from "../../lib/constants";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    router.push("/login");
    return;
  }

  setUserId(authUser.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profile) {
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setState(profile.state || "");
  }

  setLoading(false);
}

  async function saveProfile() {
    if (!userId) return;
    if (!username.trim()) { setMsg({ text: "Username is required.", type: "error" }); return; }
    if (username.length < 3) { setMsg({ text: "Username must be at least 3 characters.", type: "error" }); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMsg({ text: "Username can only contain letters, numbers, and underscores.", type: "error" });
      return;
    }

    setSaving(true);

    // Check username uniqueness (excluding self)
    const { data: existing } = await supabase
      .from("profiles").select("id").eq("username", username).neq("id", userId).single();

    if (existing) {
      setMsg({ text: "That username is already taken.", type: "error" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, username: username.trim(), bio: bio.trim(), state: state || null });

    if (error) {
      setMsg({ text: "Failed to save. Try again.", type: "error" });
    } else {
      setMsg({ text: "Profile saved!", type: "success" });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black text-yellow-400/20">Loading...</div>
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
            <Link href="/polls" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider">Polls</Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={signOut}
              className="hidden md:block text-sm font-bold text-gray-400 hover:text-red-400 transition uppercase tracking-wider"
            >
              Sign Out
            </button>
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
            <button onClick={signOut} className="block w-full text-left text-sm font-bold text-red-400 uppercase tracking-wider py-2">Sign Out</button>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-2xl px-4 md:px-6 py-8 md:py-12">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">Your Account</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-none">
            PROFILE<br />
            <span className="text-yellow-400">SETTINGS</span>
          </h1>
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`mb-6 p-4 font-bold text-sm uppercase tracking-wider ${
            msg.type === "success"
              ? "bg-yellow-400 text-black"
              : "border border-red-500/40 text-red-400"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="border border-white/10 bg-white/[0.02] relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
          <div className="p-6 md:p-8 space-y-6">

            {/* Username */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Username
              </label>
              <div className="flex items-center border border-white/10 bg-black focus-within:border-yellow-400 transition">
                <span className="text-gray-600 font-bold pl-4 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 30))}
                  placeholder="your_username"
                  className="flex-1 bg-transparent px-3 py-4 text-white placeholder-gray-600 outline-none text-sm"
                />
                <span className="text-gray-700 text-xs pr-4">{username.length}/30</span>
              </div>
              <p className="text-gray-700 text-xs mt-1">Letters, numbers, underscores only.</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Bio <span className="text-gray-700 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Tell the community who you are..."
                className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 h-24 outline-none focus:border-yellow-400 transition text-sm resize-none"
              />
              <p className="text-gray-700 text-xs mt-1">{bio.length}/200</p>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                State <span className="text-gray-700 normal-case font-normal">(optional)</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-4 py-4 text-sm font-bold outline-none focus:border-yellow-400 transition"
              >
                <option value="">Select your state</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              {username && (
                <Link
                  href={`/u/${username}`}
                  className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider"
                >
                  View Profile →
                </Link>
              )}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="ml-auto bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-3 text-sm uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Sign out of your account</p>
              <p className="text-gray-600 text-xs mt-0.5">You'll need to log back in to vote or comment.</p>
            </div>
            <button
              onClick={signOut}
              className="border border-red-500/40 text-red-400 font-black px-5 py-2.5 text-sm uppercase tracking-wider hover:bg-red-500/10 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
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
