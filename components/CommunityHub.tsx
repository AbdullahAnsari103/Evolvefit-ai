"use client"

import type React from "react"
import { useState } from "react"
import { Community } from "./Community"
import { ContestModule } from "./ContestModule"
import { LeaderboardComponent } from "./LeaderboardComponent"
import { CreatePostModal } from "./CreatePostModal"

type ViewType = "feed" | "contests" | "leaderboard"

export const CommunityHub: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>("feed")
  const [showCreatePost, setShowCreatePost] = useState(false)

  const navItems: Array<{ id: ViewType; label: string; icon: React.ReactNode }> = [
    {
      id: "feed",
      label: "Community Feed",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      id: "contests",
      label: "Contests",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9h12M6 9a6 6 0 1 0 12 0M6 9v12a6 6 0 0 0 12 0V9"></path>
        </svg>
      ),
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Community Hub</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect, compete, and grow with our thriving fitness community. Share your journey, participate in
              contests, and climb the leaderboard.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeView === item.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Create Post Button (Floating) */}
          {activeView === "feed" && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-110 transition-all flex items-center justify-center group"
              title="Create Post"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}

          {/* View Content */}
          {activeView === "feed" && <Community />}
          {activeView === "contests" && <ContestModule />}
          {activeView === "leaderboard" && <LeaderboardComponent />}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => setActiveView("feed")}
      />
    </div>
  )
}
