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
    const { base64Image, voiceContext } = await request.json()

    const prompt = `
    You are an Elite AI Nutritionist specializing in INDIAN CUISINE Analysis.
    
    TASK: Analyze this food image to create a highly accurate nutrition log.
    USER CONTEXT: "${voiceContext}" (Use this to identify hidden ingredients, cooking oil levels, or specific preparations).
    
    CRITICAL PORTION ANALYSIS (STEP-BY-STEP):
    1. **Container Calibration**: Identify the plate/bowl size. A standard Indian steel katori is 150ml (approx 150g cooked dal/sabzi). A standard dinner plate is 11 inches.
    2. **Volume Estimation**: 
       - Look at the *depth* of the food. Is the bowl full to the brim (approx 200g) or half full?
       - For Roti/Chapati: Identify size (phulka vs paratha). 1 medium Phulka = 30-40g flour.
       - For Rice: Is it a heap (approx 1.5 cups) or a flat spread (approx 0.75 cups)?
    3. **Calorie Density**:
       - **Oil/Ghee**: Look for a sheen or floating oil. If visible, add 5-10g fat buffer.
       - **Gravy**: Creamy/Nutty (North Indian) vs Watery (South Indian Rasam/Dal).
    
    OUTPUT REQUIREMENTS:
    - Return STRICT JSON with this structure only:
    {
      "name": "string",
      "description": "string",
      "macros": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "fiber": number
      },
      "confidence": number (0-100)
    }
  `

    const model = genAI.getGenerativeModel({ model: MODEL })

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error("Invalid response format")
    }

    const object = JSON.parse(jsonMatch[0])
    return NextResponse.json(object)
  } catch (error) {
    console.error("[v0] Food analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 })
  }
}
