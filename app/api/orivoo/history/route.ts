import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const userId = typeof body?.userId === "string" ? body.userId : "";

    if (!sessionId) {
      return NextResponse.json({ messages: [] });
    }

    if (!supabase) {
      return NextResponse.json({ messages: [] });
    }

    let query = supabase
      .from("orivoo_memory")
      .select("id, user_message, orivoo_reply, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("ORIVOO history read error:", error);
      return NextResponse.json({ messages: [] });
    }

    const messages = (data || []).map((item) => ({
      id: item.id,
      question: item.user_message,
      answer: item.orivoo_reply,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("ORIVOO history API error:", error);
    return NextResponse.json({ messages: [] });
  }
}