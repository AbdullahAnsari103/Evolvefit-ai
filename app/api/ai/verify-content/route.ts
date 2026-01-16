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
    const { content, imageUrl } = await request.json()

    const prompt = `
You are a community content moderator for a fitness and wellness platform. Analyze the following content for authenticity, compliance with community guidelines, and safety.

Content: "${content}"
${imageUrl ? `Image URL: ${imageUrl}` : ""}

Evaluate:
1. Is this genuine user-generated content (not AI-generated or spam)?
2. Does it comply with community guidelines (no harassment, hate speech, NSFW)?
3. Is the fitness/wellness context legitimate?
4. Are there any red flags or concerns?

Respond with ONLY this JSON structure:
{
  "isAuthentic": boolean,
  "riskScore": number (0-100),
  "category": "safe" | "warning" | "violation",
  "reasons": [strings explaining your assessment],
  "recommendations": [strings with suggestions]
}
`

    const model = genAI.getGenerativeModel({ model: MODEL })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (error) {
    console.error("[v0] Content verification error:", error)
    return NextResponse.json({
      isAuthentic: true,
      riskScore: 0,
      category: "safe",
      reasons: ["AI verification service temporarily unavailable"],
      recommendations: ["Manual review recommended"],
    })
  }
}
