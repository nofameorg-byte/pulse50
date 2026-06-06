/**
 * Notification trigger helpers for Pulse50.
 * All functions are fire-and-forget — they never throw or block the caller.
 *
 * DB schema expected:
 *   notifications(id, user_id, type, message, link, read, created_at)
 *
 * Notification types used here:
 *   reply            — someone commented on a rep you also commented on
 *   vote_milestone   — a rep you follow hits 100 / 500 / 1000 / 5000 / 10000 votes
 *   trending         — a rep you voted on enters the trending list
 *   state_activity   — high activity spike in your state
 *   share_milestone  — a rep you voted on hits 50 / 100 / 500 shares
 */

import { supabase } from "./supabase";

// ─── Internal helper ──────────────────────────────────────────────────────────

async function insertNotification(
  userId: string,
  type: string,
  message: string,
  link: string
) {
  try {
    await supabase.from("notifications").insert({ user_id: userId, type, message, link, read: false });
  } catch (_) {
    // non-blocking
  }
}

// ─── Reply alert ──────────────────────────────────────────────────────────────
/**
 * When a new comment is posted on a representative's page,
 * notify every OTHER user who has also commented on that rep.
 */
export async function triggerReplyNotifications(
  representativeId: number,
  repName: string,
  posterUserId: string
) {
  try {
    // Get all unique commenters on this rep (excluding the person who just posted)
    const { data: commenters } = await supabase
      .from("comments")
      .select("user_id")
      .eq("representative_id", representativeId)
      .neq("user_id", posterUserId);

    if (!commenters) return;

    const uniqueUserIds = [...new Set(commenters.map((c) => c.user_id))] as string[];

    // Get poster's username for the message
    const { data: posterProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", posterUserId)
      .single();

    const posterName = posterProfile?.username || "Someone";
    const link = `/representatives/${representativeId}`;
    const message = `${posterName} joined the discussion on ${repName}`;

    await Promise.all(
      uniqueUserIds.map((uid) =>
        insertNotification(uid, "reply", message, link)
      )
    );
  } catch (_) {}
}

// ─── Vote milestone ───────────────────────────────────────────────────────────
const VOTE_MILESTONES = [100, 500, 1000, 5000, 10000, 50000];

/**
 * After a vote is cast, check if the total vote count just crossed a milestone.
 * If so, notify all users who have voted on this rep.
 */
export async function triggerVoteMilestone(
  representativeId: number,
  repName: string,
  newTotalVotes: number
) {
  try {
    const milestone = VOTE_MILESTONES.find((m) => newTotalVotes === m);
    if (!milestone) return;

    // Get all voters on this rep
    const { data: voters } = await supabase
      .from("user_votes")
      .select("user_id")
      .eq("representative_id", representativeId);

    if (!voters) return;

    const uniqueUserIds = [...new Set(voters.map((v) => v.user_id))] as string[];
    const link = `/representatives/${representativeId}`;
    const message = `${repName} just hit ${milestone.toLocaleString()} votes on Pulse50`;

    await Promise.all(
      uniqueUserIds.map((uid) =>
        insertNotification(uid, "vote_milestone", message, link)
      )
    );
  } catch (_) {}
}

// ─── Trending alert ───────────────────────────────────────────────────────────
/**
 * When a rep enters the top 10 trending (by total votes), notify voters.
 * Pass the current rank (1-based). Only fires when rank <= 10.
 */
export async function triggerTrendingNotification(
  representativeId: number,
  repName: string,
  rank: number
) {
  try {
    if (rank > 10) return;

    const { data: voters } = await supabase
      .from("user_votes")
      .select("user_id")
      .eq("representative_id", representativeId);

    if (!voters) return;

    const uniqueUserIds = [...new Set(voters.map((v) => v.user_id))] as string[];
    const link = `/representatives/${representativeId}`;
    const message = `${repName} is now #${rank} trending on Pulse50`;

    await Promise.all(
      uniqueUserIds.map((uid) =>
        insertNotification(uid, "trending", message, link)
      )
    );
  } catch (_) {}
}

// ─── State activity spike ─────────────────────────────────────────────────────
/**
 * When a rep in a given state gets a vote, check if that state has had
 * a surge (>= threshold new votes in the last hour). If so, notify users
 * who have their state set to that state in their profile.
 */
export async function triggerStateActivityNotification(
  state: string,
  repName: string,
  representativeId: number
) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Count votes in this state in the last hour
    const { count: recentVotes } = await supabase
      .from("user_votes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneHourAgo);

    // Only fire at activity spikes: 50, 100, 250, 500 votes/hour
    const SPIKE_THRESHOLDS = [50, 100, 250, 500];
    const spike = SPIKE_THRESHOLDS.find((t) => recentVotes === t);
    if (!spike) return;

    // Notify users whose profile state matches
    const { data: stateUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("state", state);

    if (!stateUsers) return;

    const link = `/Polls/${encodeURIComponent(state.toLowerCase().replace(/ /g, "-"))}`;
    const message = `${state} is surging — ${spike}+ votes in the last hour`;

    await Promise.all(
      stateUsers.map((u) =>
        insertNotification(u.id, "state_activity", message, link)
      )
    );
  } catch (_) {}
}

// ─── Share milestone ──────────────────────────────────────────────────────────
const SHARE_MILESTONES = [50, 100, 500, 1000];

/**
 * After a share is logged, check if total shares just hit a milestone.
 * Notify all voters on that rep.
 */
export async function triggerShareMilestone(
  representativeId: number,
  repName: string
) {
  try {
    const { count: totalShares } = await supabase
      .from("shares")
      .select("*", { count: "exact", head: true })
      .eq("representative_id", representativeId);

    const milestone = SHARE_MILESTONES.find((m) => totalShares === m);
    if (!milestone) return;

    const { data: voters } = await supabase
      .from("user_votes")
      .select("user_id")
      .eq("representative_id", representativeId);

    if (!voters) return;

    const uniqueUserIds = [...new Set(voters.map((v) => v.user_id))] as string[];
    const link = `/representatives/${representativeId}`;
    const message = `${repName} has been shared ${milestone.toLocaleString()} times on Pulse50`;

    await Promise.all(
      uniqueUserIds.map((uid) =>
        insertNotification(uid, "share_milestone", message, link)
      )
    );
  } catch (_) {}
}
