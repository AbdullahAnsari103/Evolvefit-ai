import type { UserProfile, CoachSettings, Contest } from "../types"

export const analyzeFoodImage = async (base64Image: string, voiceContext = ""): Promise<any> => {
  try {
    const response = await fetch("/api/ai/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, voiceContext }),
    })

    if (!response.ok) throw new Error("Failed to analyze meal")
    return await response.json()
  } catch (error) {
    console.error("[v0] Food analysis error:", error)
    throw new Error("Failed to analyze meal.")
  }
}

export const chatWithTrainer = async (
  message: string,
  history: any[],
  userProfile: UserProfile,
  todaysLog: any,
  settings?: CoachSettings,
) => {
  try {
    const response = await fetch("/api/ai/chat-trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, userProfile, todaysLog, settings }),
    })

    if (!response.ok) throw new Error("Failed to chat")
    const { response: text } = await response.json()
    console.log("[v0] Chat response received")
    return text
  } catch (error) {
    console.error("[v0] AI Chat Error:", error)
    return "I'm having trouble connecting to the training server. Please try again."
  }
}

export const analyzeWorkoutVideo = async (base64Video: string): Promise<string> => {
  try {
    // Note: Video analysis would require streaming or handling large payloads
    // For now, returning a placeholder - extend API route if needed
    return "Video analysis feature coming soon."
  } catch (e) {
    console.error(e)
    return "Video processing failed."
  }
}

export const analyzeContestProof = async (
  mediaBase64: string,
  mediaType: "image" | "video",
  contest: Contest,
): Promise<{ approved: boolean; reason: string; points: number }> => {
  try {
    const response = await fetch("/api/ai/analyze-contest-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaBase64, mediaType, contest }),
    })

    if (!response.ok) throw new Error("Failed to analyze proof")
    return await response.json()
  } catch (error) {
    console.error("AI Proof Verification Failed:", error)
    return {
      approved: false,
      reason: "Unable to verify at this moment. Please ensure clear lighting.",
      points: 0,
    }
  }
}

export const generatePlan = async (type: "meal" | "workout", profile: UserProfile): Promise<any> => {
  try {
    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, profile }),
    })

    if (!response.ok) throw new Error("Failed to generate plan")
    return await response.json()
  } catch (error) {
    console.error("[v0] Plan generation error:", error)
    throw new Error("Failed to generate plan")
  }
}

export const generateInsightAnalysis = async (logs: any[], targets: any): Promise<string> => {
  try {
    // Could be extended to use API route if needed
    return "Insight analysis coming soon."
  } catch (e) {
    return "Could not generate analysis."
  }
}
