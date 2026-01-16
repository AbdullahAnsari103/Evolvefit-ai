import { createBrowserClient } from "@supabase/ssr"
import { verifyContentAuthenticity } from "./ai-verification"

const getSupabaseClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export interface CreatePostRequest {
  content: string
  imageFile?: File
  tags?: string[]
  category: "Milestone" | "Nutrition" | "General"
}

export interface PostResponse {
  id: string
  userId: string
  content: string
  imageUrl?: string
  tags?: string[]
  category: string
  createdAt: string
  likesCount: number
  commentsCount: number
  moderationStatus: "pending" | "approved" | "rejected"
  isVerified: boolean
}

export const uploadPostImage = async (file: File): Promise<string> => {
  const supabase = getSupabaseClient()

  // Compress and resize image
  const canvas = document.createElement("canvas")
  const img = new Image()
  img.crossOrigin = "anonymous"

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width
        let height = img.height
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"))
              return
            }

            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
            const { data, error } = await supabase.storage.from("post-images").upload(`public/${fileName}`, blob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            })

            if (error) {
              reject(new Error(`Upload failed: ${error.message}`))
            } else {
              const { data: publicUrl } = supabase.storage.from("post-images").getPublicUrl(`public/${fileName}`)

              resolve(publicUrl.publicUrl)
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export const createPost = async (request: CreatePostRequest): Promise<PostResponse> => {
  const supabase = getSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Verify content authenticity
  let imageUrl: string | undefined
  if (request.imageFile) {
    imageUrl = await uploadPostImage(request.imageFile)
  }

  const verification = await verifyContentAuthenticity(request.content, imageUrl)

  // Insert post
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      content: request.content,
      image_url: imageUrl,
      tags: request.tags || [],
      category: request.category,
      moderation_status: verification.category === "violation" ? "rejected" : "pending",
      moderation_feedback: verification.reasons.join("; "),
      is_verified: verification.isAuthentic,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    imageUrl: data.image_url,
    tags: data.tags,
    category: data.category,
    createdAt: data.created_at,
    likesCount: data.likes_count,
    commentsCount: data.comments_count,
    moderationStatus: data.moderation_status,
    isVerified: data.is_verified,
  }
}

export const updatePost = async (postId: string, content: string): Promise<PostResponse> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("community_posts").update({ content }).eq("id", postId).select().single()

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    imageUrl: data.image_url,
    tags: data.tags,
    category: data.category,
    createdAt: data.created_at,
    likesCount: data.likes_count,
    commentsCount: data.comments_count,
    moderationStatus: data.moderation_status,
    isVerified: data.is_verified,
  }
}

export const deletePost = async (postId: string): Promise<void> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("community_posts").delete().eq("id", postId)

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`)
  }
}

export const likePost = async (postId: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    // Unlike
    await supabase.from("post_likes").delete().eq("id", existing.id)

    // Update count
    await supabase.rpc("decrement_likes", { post_id: postId })
    return false
  } else {
    // Like
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    })

    // Update count
    await supabase.rpc("increment_likes", { post_id: postId })
    return true
  }
}

export const addComment = async (postId: string, content: string): Promise<{ id: string; createdAt: string }> => {
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select("id, created_at")
    .single()

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`)
  }

  // Update comment count
  await supabase.rpc("increment_comments", { post_id: postId })

  return { id: data.id, createdAt: data.created_at }
}
