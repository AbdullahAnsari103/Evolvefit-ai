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
    const { type, profile } = await request.json()

    if (!profile) {
      return NextResponse.json({ error: "Profile data required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: MODEL })

    let prompt = ""
    const schema = {}

    if (type === "workout") {
      prompt = `You are a professional fitness coach. Generate a detailed workout plan in valid JSON format.

User Profile:
- Experience Level: ${profile.experience || "Intermediate"}
- Goal: ${profile.goal || "Muscle Gain"}
- Activity Level: ${profile.activityLevel || "Moderately Active"}
- Days Available: ${profile.daysPerWeek || 5}

SPLIT LOGIC:
- If "Very Active" OR "Muscle Gain": Generate "Push Pull Legs" (PPL) 6-day split
- If "Moderately Active": Generate "Upper/Lower" 4-day split  
- If "Sedentary" OR "Lightly Active": Generate "Full Body" 3-day split

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "splitName": "string",
  "overview": "string",
  "schedule": [
    {
      "day": "Day 1",
      "focus": "Push",
      "description": "string",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 4,
          "reps": "8-10",
          "rest": "90s",
          "tips": "Form tip",
          "youtubeUrl": "https://www.youtube.com/watch?v=VALID_ID"
        }
      ]
    }
  ]
}`
    } else {
      prompt = `You are a professional nutritionist specializing in Indian cuisine. Generate a detailed 1-day meal plan in valid JSON format.

User Profile:
- Diet Type: ${profile.diet || "Vegetarian"}
- Target Calories: ${profile.targets?.calories || 2000}
- Protein Target: ${profile.targets?.protein || 150}g
- Carbs Target: ${profile.targets?.carbs || 200}g
- Fats Target: ${profile.targets?.fats || 65}g

REQUIREMENTS:
- Use ONLY authentic Indian home-cooked (Ghar ka Khana) recipes
- Ensure total calories match the target
- Include macros for each ingredient
- All meals must be practical to prepare at home

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "dayName": "Day 1",
  "totalCalories": 2000,
  "totalProtein": 150,
  "totalCarbs": 200,
  "totalFats": 65,
  "meals": [
    {
      "mealName": "Breakfast",
      "time": "8:00 AM",
      "items": [
        {
          "name": "Dish Name",
          "quantity": "1 cup",
          "calories": 300,
          "protein": 15,
          "carbs": 40,
          "fats": 8
        }
      ]
    }
  ]
}`
    }

    console.log("[v0] Sending request to Gemini model:", MODEL)

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    })

    const responseText = result.response.text()
    console.log("[v0] Gemini response received, length:", responseText.length)

    let jsonData

    // Try to find JSON block with various patterns
    const patterns = [
      /```json\n?([\s\S]*?)\n?```/, // markdown code block
      /```\n?([\s\S]*?)\n?```/, // generic code block
      /\{[\s\S]*\}/, // direct JSON object
    ]

    for (const pattern of patterns) {
      const match = responseText.match(pattern)
      if (match) {
        const jsonStr = match[1] || match[0]
        try {
          jsonData = JSON.parse(jsonStr)
          console.log("[v0] Successfully parsed JSON from pattern")
          break
        } catch (e) {
          console.log("[v0] Pattern failed, trying next...")
          continue
        }
      }
    }

    if (!jsonData) {
      console.error("[v0] Failed to extract JSON. Response:", responseText.substring(0, 500))
      throw new Error("Invalid response format from AI")
    }

    if (
      type === "workout" &&
      (!jsonData.schedule || !Array.isArray(jsonData.schedule) || jsonData.schedule.length === 0)
    ) {
      throw new Error("Invalid workout plan structure")
    }

    if (type === "meal" && (!jsonData.meals || !Array.isArray(jsonData.meals) || jsonData.meals.length === 0)) {
      throw new Error("Invalid meal plan structure")
    }

    console.log("[v0] Plan generated successfully")
    return NextResponse.json(jsonData)
  } catch (error) {
    console.error("[v0] Plan generation error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to generate plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
