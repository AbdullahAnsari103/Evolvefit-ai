"use client"

import type React from "react"
import { useState, useRef } from "react"
import { createPost } from "@/lib/post-service"
import { useToast } from "@/hooks/use-toast"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: () => void
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [category, setCategory] = useState<"Milestone" | "Nutrition" | "General">("General")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please write something to post",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await createPost({
        content: content.trim(),
        imageFile: selectedImage || undefined,
        category,
        tags: content.match(/#\w+/g) || [],
      })

      toast({
        title: "Success",
        description: "Post created and sent for moderation",
        variant: "default",
      })

      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      setCategory("General")
      onPostCreated?.()
      onClose()
    } catch (error) {
      console.error("[v0] Post creation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-3xl w-full max-w-md border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your fitness journey..."
            className="w-full bg-muted text-foreground rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] placeholder-muted-foreground"
            disabled={isLoading}
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden h-64 border border-border group">
              <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground p-2 rounded-full hover:bg-destructive transition-colors backdrop-blur-sm"
                disabled={isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-muted text-foreground rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              disabled={isLoading}
            >
              <option value="General">General Update</option>
              <option value="Milestone">Milestone Achievement</option>
              <option value="Nutrition">Nutrition Tip</option>
            </select>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isLoading}
              />

              <button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="bg-primary text-primary-foreground font-bold py-2 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                {isLoading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
