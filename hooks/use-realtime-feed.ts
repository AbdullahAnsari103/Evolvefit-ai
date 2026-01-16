"use client"

import { useEffect, useState } from "react"
import { subscribeToFeed, subscribeToComments, subscribeToLikes } from "@/lib/supabase/realtime"

export interface FeedPost {
  id: string
  userId: string
  content: string
  imageUrl?: string
  createdAt: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
  comments?: Array<{ id: string; userId: string; content: string; createdAt: string }>
}

export const useRealtimeFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to new posts
    const postSubscription = subscribeToFeed((newPost) => {
      setPosts((prev) => [newPost, ...prev])
    })

    // Subscribe to new comments across all posts
    posts.forEach((post) => {
      subscribeToComments(post.id, (newComment) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === newComment.post_id
              ? {
                  ...p,
                  comments: [...(p.comments || []), newComment],
                  commentsCount: p.commentsCount + 1,
                }
              : p,
          ),
        )
      })
    })

    // Subscribe to likes changes
    posts.forEach((post) => {
      subscribeToLikes(post.id, (newCount) => {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likesCount: newCount } : p)))
      })
    })

    setLoading(false)

    return () => {
      postSubscription?.unsubscribe()
    }
  }, [posts.length])

  return { posts, loading, error, setPosts }
}
