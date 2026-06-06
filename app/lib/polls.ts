import { supabase } from "./supabase";

export async function getPolls() {
  const { data, error } = await supabase
    .from("pulse_polls")
    .select("*")
    .eq("active", true)
    .order("id");

  if (error) {
    console.error("Get polls error:", error);
    return [];
  }

  return data || [];
}

export async function votePoll(
  pollId: number,
  userId: string,
  voteType: "standby" | "walkaway"
) {
  const { error } = await supabase
    .from("pulse_poll_votes")
    .insert({
      poll_id: pollId,
      user_id: userId,
      vote_type: voteType,
    });

  if (error) {
    console.error("Vote poll error:", error);
    throw error;
  }
}