"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const attempts: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  const recent = attempts.filter((t) => now - t < 60_000);
  attempts.length = 0;
  attempts.push(...recent);
  return recent.length >= 5;
}

function recordAttempt() {
  attempts.push(Date.now());
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (honeypot) return;

    if (isRateLimited()) {
      setError("Too many attempts. Please wait a minute and try again.");
      return;
    }

    recordAttempt();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      if (!username.trim()) {
        setError("Please choose a username.");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError("Username must be at least 3 characters.");
        setLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Username can only contain letters, numbers, and underscores.");
        setLoading(false);
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        setError("That username is already taken.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          is_admin: false,
          banned: false,
        });
      }

      setSuccess("Account created! Check your email to confirm, then log in.");
      setMode("login");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("banned")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      setError("Account profile could not be verified.");
      setLoading(false);
      return;
    }

    if (profile?.banned) {
      await supabase.auth.signOut();
      setError("Your account has been restricted.");
      setLoading(false);
      return;
    }

    router.push("/representatives");
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
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
              {mode === "login" ? "Welcome back" : "Join Pulse50"}
            </p>

            <h1 className="text-5xl font-black text-white leading-none">
              {mode === "login" ? "SIGN IN" : "CREATE\nACCOUNT"}
            </h1>
          </div>

          <div className="flex border border-white/10 mb-8">
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition ${
                mode === "login"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition ${
                mode === "signup"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {success && (
            <div className="mb-6 border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 text-sm font-bold">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                height: 0,
              }}
            />

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="citizen_name"
                  autoComplete="username"
                  className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Letters, numbers, underscores only.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Email
              </label>

              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-black border border-white/10 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "Min. 8 characters" : "••••••••"
                  }
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className="w-full bg-black border border-white/10 px-4 py-4 pr-12 text-white placeholder-gray-600 outline-none focus:border-yellow-400 transition text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 text-sm uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-600 mt-6">
              Forgot your password?{" "}
              <Link
                href="/reset-password"
                className="text-yellow-400 hover:underline font-bold"
              >
                Reset it
              </Link>
            </p>
          )}

          <p className="text-center text-xs text-gray-700 mt-8 leading-relaxed">
            By creating an account you agree to our terms of service. Pulse50 is
            a public opinion platform and does not represent official government
            positions.
          </p>
        </div>
      </div>
    </main>
  );
}