import type { ContestSubmission } from "@/types"
import { realtimeManager } from "@/lib/realtime-updates"

const STORAGE_KEYS = {
  CONTESTS: "evolvefit_contests",
  SUBMISSIONS: "evolvefit_contest_submissions",
  LEADERBOARD: "evolvefit_contest_leaderboard",
  USER_CONTEST_STATE: "evolvefit_user_contest_state",
}

interface UserContestState {
  userId: string
  acceptedContestIds: Set<string>
  totalPoints: number
  lastUpdated: number
}

export const getUserContestState = (userId: string): UserContestState => {
  const key = `${STORAGE_KEYS.USER_CONTEST_STATE}_${userId}`
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        acceptedContestIds: new Set(parsed.acceptedContestIds),
      }
    }
  } catch (e) {
    console.warn("Failed to load user contest state", e)
  }

  return {
    userId,
    acceptedContestIds: new Set(),
    totalPoints: 0, // Start from 0, not 80
    lastUpdated: Date.now(),
  }
}

export const saveUserContestState = (state: UserContestState): void => {
  const key = `${STORAGE_KEYS.USER_CONTEST_STATE}_${state.userId}`
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...state,
        acceptedContestIds: Array.from(state.acceptedContestIds),
        lastUpdated: Date.now(),
      }),
    )
  } catch (e) {
    console.warn("Failed to save user contest state", e)
  }
}

export const acceptChallenge = (userId: string, contestId: string): boolean => {
  const state = getUserContestState(userId)

  // If already accepted, return false
  if (state.acceptedContestIds.has(contestId)) {
    return false
  }

  // Accept the challenge
  state.acceptedContestIds.add(contestId)
  state.lastUpdated = Date.now()
  saveUserContestState(state)

  // Broadcast real-time update
  realtimeManager.broadcast("contests", {
    type: "contest",
    data: {
      event: "challenge_accepted",
      userId,
      contestId,
      timestamp: Date.now(),
    },
  })

  return true
}

export const awardContestPoints = (userId: string, points: number, contestId: string): void => {
  const state = getUserContestState(userId)
  state.totalPoints += points
  state.lastUpdated = Date.now()
  saveUserContestState(state)

  // Broadcast leaderboard update
  realtimeManager.broadcast("contests", {
    type: "leaderboard",
    data: {
      event: "points_awarded",
      userId,
      points,
      contestId,
      totalPoints: state.totalPoints,
      timestamp: Date.now(),
    },
  })
}

export const hasAcceptedContest = (userId: string, contestId: string): boolean => {
  const state = getUserContestState(userId)
  return state.acceptedContestIds.has(contestId)
}

export const getUserTotalPoints = (userId: string): number => {
  const state = getUserContestState(userId)
  return state.totalPoints
}

export const saveContestSubmission = (submission: ContestSubmission): void => {
  const submissions = getContestSubmissions()
  submissions.push(submission)
  try {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions))
  } catch (e) {
    console.warn("Failed to save submission", e)
  }

  // Broadcast in real-time
  realtimeManager.broadcast("contests", {
    type: "contest",
    data: {
      event: "submission_received",
      submission,
      timestamp: Date.now(),
    },
  })
}

export const getContestSubmissions = (): ContestSubmission[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.warn("Failed to load submissions", e)
    return []
  }
}

export default {
  getUserContestState,
  saveUserContestState,
  acceptChallenge,
  awardContestPoints,
  hasAcceptedContest,
  getUserTotalPoints,
  saveContestSubmission,
  getContestSubmissions,
}
