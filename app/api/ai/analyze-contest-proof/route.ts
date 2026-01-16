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
    const { mediaBase64, mediaType, contest } = await request.json()

    const prompt = `
    You are an AI Referee for a fitness contest called "${contest.title}".
    
    CONTEST RULES & CONTEXT:
    - Description: ${contest.description}
    - Rules: ${contest.rules.join("; ")}
    
    YOUR TASK:
    Analyze the uploaded media to verify if the user has completed the challenge.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "approved": boolean,
      "reason": "A short, encouraging message if approved, or specific reason if rejected.",
      "points": number
    }
  `

    const model = genAI.getGenerativeModel({ model: MODEL })

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: mediaBase64,
          mimeType: mediaType === "image" ? "image/jpeg" : "video/mp4",
        },
      },
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ approved: false, reason: "Could not verify", points: 0 })
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error) {
    console.error("AI Proof Verification Failed:", error)
    return NextResponse.json({
      approved: false,
      reason: "Unable to verify at this moment. Please ensure clear lighting.",
      points: 0,
    })
  }
}
