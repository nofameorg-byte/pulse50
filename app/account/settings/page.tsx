"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AccountSettingsPage() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full border border-white/10 bg-white/[0.02] p-8">
        <h1 className="text-4xl font-black mb-6">
          ACCOUNT
        </h1>

        <h2 className="text-xl font-bold text-yellow-400 mb-3">
          Civic Identity
        </h2>

        <p className="text-gray-300 mb-4">
          Your civic identity is automatically assigned and cannot be changed.
        </p>

        <p className="text-gray-500 text-sm mb-8">
          Your comments and votes are displayed using your civic identity to
          protect privacy while encouraging public participation.
        </p>

        <button
          onClick={signOut}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 uppercase tracking-wider"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}