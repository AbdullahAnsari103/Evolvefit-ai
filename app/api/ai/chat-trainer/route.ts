import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY || "")
const MODEL = "gemini-3-flash-preview"

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const { message, history, userProfile, todaysLog, settings } = await request.json()

    const simplifiedLog = todaysLog.meals.map((m: any) => ({
      name: m.name,
      description: m.description,
      time: m.timestamp,
      macros: m.macros,
    }))

    const personalityContext = settings
      ? `
    COACH SETTINGS:
    - Personality: ${settings.personality}
    - Primary Focus: ${settings.focus}
    `
      : ""

    const systemContext = `
    You are EVOLVEFIT AI Trainer, a personalized fitness coach for Indian users.
    
    USER PROFILE:
    - Name: ${userProfile.name}
    - Age: ${userProfile.age} | Gender: ${userProfile.gender}
    - Height: ${userProfile.height}cm | Weight: ${userProfile.currentWeight}kg
    - Goal: ${userProfile.goal} (Target: ${userProfile.goalWeight}kg)
    - Targets: ${JSON.stringify(userProfile.targets)}
    
    TODAY'S LOGS:
    - Meals: ${JSON.stringify(simplifiedLog)}
    - Total Consumed: ${JSON.stringify(todaysLog.totalMacros)}
    
    ${personalityContext}
    
    STYLE: Encouraging, data-driven, strict but fair. Use Indian food contexts. Be brief.
  `

    const model = genAI.getGenerativeModel({ model: MODEL })

    const validHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []

    for (const h of history || []) {
      if (h.role === "user" || h.role === "model") {
        validHistory.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content || "" }],
        })
      }
    }

    let chatHistory = validHistory
    let userMessage = message

    if (chatHistory.length === 0) {
      // First message in conversation - include system context
      userMessage = `${systemContext}\n\nUser: ${message}`
    } else if (chatHistory.length > 0 && chatHistory[0].role !== "user") {
      // If history starts with model message, filter out invalid leading messages
      chatHistory = chatHistory.filter((msg) => msg.role === "user")
    }

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(userMessage)
    const text = result.response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return NextResponse.json(
      { error: "I'm having trouble connecting to the training server. Please try again." },
      { status: 500 },
    )
  }
}
