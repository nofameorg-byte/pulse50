"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    // Always show success to prevent email enumeration
    if (resetError) console.error(resetError);
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="border-b border-white/10 px-6 py-5">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-white">Pulse</span>
          <span className="text-yellow-400">50</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">Account Recovery</p>
            <h1 className="text-5xl font-black text-white leading-none">RESET<br />PASSWORD</h1>
          </div>

          {sent ? (
            <div className="border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-green-400 font-bold mb-2">Check your inbox.</p>
              <p className="text-gray-400 text-sm">
                If an account exists for <span className="text-white font-bold">{email}</span>, we sent a reset link. Check your spam folder too.
              </p>
              <Link href="/login" className="mt-4 block text-center bg-yellow-400 text-black font-black py-3 text-sm uppercase tracking-wider hover:bg-yellow-300 transition">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm font-bold">{error}</div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 text-sm uppercase tracking-wider transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link href="/login" className="block text-center text-xs text-gray-600 hover:text-yellow-400 transition font-bold mt-2">
                ← Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
