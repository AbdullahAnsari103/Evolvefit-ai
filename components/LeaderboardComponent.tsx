"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard-service"

export const LeaderboardComponent: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "alltime">("alltime")

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard(50)
        setEntries(data)
      } catch (error) {
        console.error("[v0] Failed to load leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [timeframe])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top contributors and winners</p>
        </div>

        <div className="flex gap-2">
          {(["weekly", "monthly", "alltime"] as const).map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeframe(frame)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === frame
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="order-1 md:order-1">
            <div className="bg-card border border-silver/30 rounded-2xl p-6 text-center transform md:scale-90">
              <div className="text-4xl mb-2">🥈</div>
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3"></div>
              <h3 className="text-lg font-bold text-foreground">{entries[1].username}</h3>
              <p className="text-2xl font-bold text-accent mt-2">{entries[1].points}</p>
              <p className="text-xs text-muted-foreground mt-1">pts</p>
            </div>
          </div>

          {/* 1st Place (Champion) */}
          <div className="order-0 md:order-2">
            <div className="bg-card border border-primary rounded-2xl p-6 text-center ring-2 ring-primary/20">
              <div className="text-5xl mb-2">👑</div>
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3"></div>
              <h3 className="text-xl font-bold text-foreground">{entries[0].username}</h3>
              <p className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
                {entries[0].points}
              </p>
              <p className="text-xs text-muted-foreground mt-1">pts</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-2 md:order-3">
            <div className="bg-card border border-amber-600/30 rounded-2xl p-6 text-center transform md:scale-90">
              <div className="text-4xl mb-2">🥉</div>
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3"></div>
              <h3 className="text-lg font-bold text-foreground">{entries[2].username}</h3>
              <p className="text-2xl font-bold text-accent mt-2">{entries[2].points}</p>
              <p className="text-xs text-muted-foreground mt-1">pts</p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Rankings</h2>
          <span className="text-sm text-muted-foreground">{entries.length} users</span>
        </div>

        <div className="divide-y divide-border">
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-bold text-sm text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2">Points</div>
            <div className="col-span-2">Posts</div>
            <div className="col-span-2">Wins</div>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.userId}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors items-center"
            >
              <div className="col-span-1">
                <span className="text-lg font-bold text-primary">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </span>
              </div>
              <div className="col-span-5">
                <p className="font-semibold text-foreground">{entry.username}</p>
              </div>
              <div className="col-span-2">
                <p className="font-bold text-primary">{entry.points}</p>
              </div>
              <div className="col-span-2">
                <p className="text-foreground">{entry.postsCount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-foreground">{entry.winsCount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
