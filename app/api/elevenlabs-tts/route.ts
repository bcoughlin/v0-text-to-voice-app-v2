import { type NextRequest, NextResponse } from "next/server"
import { VoiceGenerator } from "elevenlabs-node"

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 })
    }

    // Default voice if not provided
    const voiceToUse = voice || "Adam"

    // Initialize ElevenLabs Voice Generator
    const voiceGenerator = new VoiceGenerator({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    // Generate speech using ElevenLabs
    const audioResponse = await voiceGenerator.generateVoice(text, getElevenLabsVoiceId(voiceToUse))

    // Return the audio file
    return new NextResponse(Buffer.from(audioResponse), {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error: any) {
    console.error("Error generating speech with ElevenLabs:", error)
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 })
  }
}

// Map voice names to ElevenLabs voice IDs
function getElevenLabsVoiceId(voice: string): string {
  const voiceMap: Record<string, string> = {
    Adam: "pNInz6obpgDQGcFmaJgB", // Adam
    Antoni: "ErXwobaYiN019PkySvjV", // Antoni
    Arnold: "VR6AewLTigWG4xSOukaG", // Arnold
    Bella: "EXAVITQu4vr4xnSDxMaL", // Bella
    Domi: "AZnzlk1XvdvUeBnXmlld", // Domi
    Elli: "MF3mGyEYCl7XYWbV9V6O", // Elli
    Josh: "TxGEqnHWrfWFTfGW9XjX", // Josh
    Rachel: "21m00Tcm4TlvDq8ikWAM", // Rachel
    Sam: "yoZ06aMxZJJ28mfd3POQ", // Sam
    // Default to Adam if voice not found
    default: "pNInz6obpgDQGcFmaJgB",
  }

  return voiceMap[voice] || voiceMap["default"]
}
