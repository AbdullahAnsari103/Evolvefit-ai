import type { Post, Comment } from "@/types"
import { realtimeManager, type RealtimeSubscription } from "@/lib/realtime-updates"

export const subscribeToCommunityFeed = (callback: (posts: Post[]) => void): RealtimeSubscription => {
  return realtimeManager.subscribe("community", (message) => {
    if (message.type === "post") {
      // Fetch updated posts from storage
      const posts = getPostsFromStorage()
      callback(posts)
    }
  })
}

export const broadcastNewPost = (post: Post): void => {
  realtimeManager.broadcast("community", {
    type: "post",
    data: {
      event: "new_post",
      post,
      timestamp: Date.now(),
    },
  })
}

export const broadcastComment = (postId: number, comment: Comment): void => {
  realtimeManager.broadcast("community", {
    type: "comment",
    data: {
      event: "new_comment",
      postId,
      comment,
      timestamp: Date.now(),
    },
  })
}

export const broadcastLike = (postId: number, likes: number): void => {
  realtimeManager.broadcast("community", {
    type: "like",
    data: {
      event: "post_liked",
      postId,
      likes,
      timestamp: Date.now(),
    },
  })
}

// Helper to get posts from storage
const getPostsFromStorage = (): Post[] => {
  try {
    const stored = localStorage.getItem("evolvefit_posts")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export default {
  subscribeToCommunityFeed,
  broadcastNewPost,
  broadcastComment,
  broadcastLike,
}
