"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getUserRank, getUserRewards, type LeaderboardEntry, type UserReward } from "@/lib/leaderboard-service"

export const UserRewardsPanel: React.FC = () => {
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [rewards, setRewards] = useState<UserReward[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Note: In production, get userId from auth context
        const demoUserId = "current-user-id"

        const [rankData, rewardsData] = await Promise.all([getUserRank(demoUserId), getUserRewards(demoUserId)])

        setUserRank(rankData)
        setRewards(rewardsData)
      } catch (error) {
        console.error("[v0] Failed to load user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* User Stats Card */}
      {userRank && (
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rank</p>
              <p className="text-3xl font-bold text-primary">#{userRank.rank}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Points</p>
              <p className="text-3xl font-bold text-foreground">{userRank.points}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Posts</p>
              <p className="text-3xl font-bold text-foreground">{userRank.postsCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Wins</p>
              <p className="text-3xl font-bold text-accent">{userRank.winsCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Rewards */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Recent Rewards</h2>
        </div>

        {rewards.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No rewards yet. Start posting and participating in contests!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-foreground">{reward.description}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(reward.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">+{reward.points}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
