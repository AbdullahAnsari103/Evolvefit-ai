import { createBrowserClient } from "@supabase/ssr"

const getSupabaseClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export interface LeaderboardEntry {
  userId: string
  username: string
  rank: number
  points: number
  postsCount: number
  winsCount: number
  verifiedCount: number
  avatar?: string
}

export interface UserReward {
  id?: string
  rewardType: "post_approved" | "contest_win" | "community_points" | "milestone"
  points: number
  description: string
  createdAt: string
}

export const getLeaderboard = async (limit = 50): Promise<LeaderboardEntry[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("leaderboard").select("*").order("rank", { ascending: true }).limit(limit)

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`)
  }

  return data.map((entry, idx) => ({
    userId: entry.user_id,
    username: entry.username,
    rank: idx + 1,
    points: entry.points,
    postsCount: entry.posts_count,
    winsCount: entry.wins_count,
    verifiedCount: entry.verified_count,
  }))
}

export const getUserRank = async (userId: string): Promise<LeaderboardEntry | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("leaderboard").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("[v0] Failed to fetch user rank:", error)
    return null
  }

  const { data: allEntries } = await supabase.from("leaderboard").select("id").order("points", { ascending: false })

  const rank = allEntries?.findIndex((e) => e.id === data.id) + 1 || 0

  return {
    userId: data.user_id,
    username: data.username,
    rank,
    points: data.points,
    postsCount: data.posts_count,
    winsCount: data.wins_count,
    verifiedCount: data.verified_count,
  }
}

export const addReward = async (
  userId: string,
  rewardType: "post_approved" | "contest_win" | "community_points" | "milestone",
  points: number,
): Promise<UserReward> => {
  const supabase = getSupabaseClient()

  // Add reward entry
  const { data, error } = await supabase
    .from("user_rewards")
    .insert({
      user_id: userId,
      reward_type: rewardType,
      points,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add reward: ${error.message}`)
  }

  // Update leaderboard
  const leaderboardEntry = await supabase.from("leaderboard").select("points").eq("user_id", userId).single()

  if (leaderboardEntry.data) {
    await supabase
      .from("leaderboard")
      .update({ points: leaderboardEntry.data.points + points })
      .eq("user_id", userId)
  }

  const rewardDescriptions: Record<string, string> = {
    post_approved: "Post approved by moderators",
    contest_win: "Contest victory",
    community_points: "Community engagement",
    milestone: "Milestone achievement",
  }

  return {
    id: data.id,
    rewardType,
    points,
    description: rewardDescriptions[rewardType],
    createdAt: data.created_at,
  }
}

export const getUserRewards = async (userId: string): Promise<UserReward[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("user_rewards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch rewards: ${error.message}`)
  }

  const rewardDescriptions: Record<string, string> = {
    post_approved: "Post approved by moderators",
    contest_win: "Contest victory",
    community_points: "Community engagement",
    milestone: "Milestone achievement",
  }

  return data.map((reward) => ({
    id: reward.id,
    rewardType: reward.reward_type,
    points: reward.points,
    description: rewardDescriptions[reward.reward_type] || "Community reward",
    createdAt: reward.created_at,
  }))
}

export const getTotalUserPoints = async (userId: string): Promise<number> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("user_rewards").select("points").eq("user_id", userId)

  if (error) {
    console.error("[v0] Failed to fetch user points:", error)
    return 0
  }

  return data.reduce((sum, reward) => sum + reward.points, 0)
}
