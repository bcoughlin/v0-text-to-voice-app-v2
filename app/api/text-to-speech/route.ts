import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

export async function POST(request: NextRequest) {
  try {
    const { text, voice, model } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Default values if not provided
    const voiceToUse = voice || "alloy"
    const modelToUse = model || "tts-1"

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Generate speech using OpenAI
    const mp3 = await openai.audio.speech.create({
      model: modelToUse,
      voice: voiceToUse,
      input: text,
    })

    // Get the audio data as a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Return the audio file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("Error generating speech:", error)
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 })
  }
}
