import { createBrowserClient } from "@supabase/ssr"

let realtimeClient: ReturnType<typeof createBrowserClient> | null = null

export const getRealtimeClient = () => {
  if (!realtimeClient) {
    realtimeClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return realtimeClient
}

export const subscribeToFeed = (callback: (post: any) => void) => {
  const supabase = getRealtimeClient()

  const subscription = supabase
    .channel("community_feed")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "community_posts",
        filter: "moderation_status=eq.approved",
      },
      (payload) => {
        callback(payload.new)
      },
    )
    .subscribe()

  return subscription
}

export const subscribeToComments = (postId: string, callback: (comment: any) => void) => {
  const supabase = getRealtimeClient()

  const subscription = supabase
    .channel(`post_${postId}_comments`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "post_comments",
        filter: `post_id=eq.${postId}`,
      },
      (payload) => {
        callback(payload.new)
      },
    )
    .subscribe()

  return subscription
}

export const subscribeToLikes = (postId: string, callback: (count: number) => void) => {
  const supabase = getRealtimeClient()

  const subscription = supabase
    .channel(`post_${postId}_likes`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "post_likes",
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Trigger a count update
        supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .eq("post_id", postId)
          .then(({ count }) => callback(count || 0))
      },
    )
    .subscribe()

  return subscription
}
