/**
 * Pulse50 Trending Score Algorithm
 *
 * Score = (total_votes * 1.0)
 *       + (discussion_count * 2.5)       ← discussions weighted higher
 *       + (recent_votes_24h * 4.0)       ← velocity bonus
 *       + (share_count * 3.0)            ← virality bonus
 *       + recency_decay                  ← newer reps get a boost
 *
 * Recency decay: reps added in last 7 days get +50 bonus,
 * last 30 days get +20, older get 0.
 */

export interface TrendingCandidate {
  id: number;
  name: string;
  title: string;
  state: string;
  category: string;
  approve_count?: number;
  disapprove_count?: number;
  discussion_count?: number;
  recent_votes?: number;      // votes in last 24h
  share_count?: number;       // total shares
  created_at?: string;
}

export function computeTrendingScore(item: TrendingCandidate): number {
  const totalVotes = (item.approve_count || 0) + (item.disapprove_count || 0);
  const discussions = item.discussion_count || 0;
  const recentVotes = item.recent_votes || 0;
  const shares = item.share_count || 0;

  // Recency bonus
  let recencyBonus = 0;
  if (item.created_at) {
    const ageMs = Date.now() - new Date(item.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) recencyBonus = 50;
    else if (ageDays <= 30) recencyBonus = 20;
  }

  return (
    totalVotes * 1.0 +
    discussions * 2.5 +
    recentVotes * 4.0 +
    shares * 3.0 +
    recencyBonus
  );
}

export type SortMode =
  | "trending"        // weighted score
  | "most_votes"      // raw vote count
  | "most_discussed"  // comment count
  | "most_approved"   // highest approval %
  | "most_disapproved"// highest disapproval %
  | "recent";         // newest activity (24h votes)

export function sortByMode(
  items: TrendingCandidate[],
  mode: SortMode
): TrendingCandidate[] {
  const sorted = [...items];

  switch (mode) {
    case "trending":
      return sorted.sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a));

    case "most_votes":
      return sorted.sort(
        (a, b) =>
          (b.approve_count || 0) + (b.disapprove_count || 0) -
          ((a.approve_count || 0) + (a.disapprove_count || 0))
      );

    case "most_discussed":
      return sorted.sort((a, b) => (b.discussion_count || 0) - (a.discussion_count || 0));

    case "most_approved": {
      const pct = (x: TrendingCandidate) => {
        const t = (x.approve_count || 0) + (x.disapprove_count || 0);
        return t > 0 ? (x.approve_count || 0) / t : 0;
      };
      return sorted.sort((a, b) => pct(b) - pct(a));
    }

    case "most_disapproved": {
      const pct = (x: TrendingCandidate) => {
        const t = (x.approve_count || 0) + (x.disapprove_count || 0);
        return t > 0 ? (x.disapprove_count || 0) / t : 0;
      };
      return sorted.sort((a, b) => pct(b) - pct(a));
    }

    case "recent":
      return sorted.sort((a, b) => (b.recent_votes || 0) - (a.recent_votes || 0));

    default:
      return sorted;
  }
}
