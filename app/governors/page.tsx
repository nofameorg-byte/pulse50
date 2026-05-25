"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GovernorsPage() {
  const [governors, setGovernors] = useState<any[]>([]);

  useEffect(() => {
    fetchGovernors();
  }, []);

  async function fetchGovernors() {
    const { data, error } = await supabase
      .from("representatives")
      .select("*")
      .ilike("title", "%governor%")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setGovernors(data || []);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-black mb-8">
        <span className="text-yellow-400">GOVERNORS</span>
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {governors.map((gov) => (
          <div
            key={gov.id}
            className="border border-yellow-500 bg-[#050505] p-5 rounded-xl"
          >
            <img
              src={gov.image_url || "/placeholder.png"}
              alt={gov.name}
              className="w-24 h-24 object-cover rounded-full mb-4"
            />

            <h2 className="text-2xl font-bold">
              {gov.name}
            </h2>

            <p className="text-gray-400">
              {gov.state}
            </p>

            <p className="mt-2 text-yellow-400">
              {gov.party}
            </p>

            <button className="mt-5 w-full bg-yellow-400 text-black py-3 rounded-lg font-bold">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}