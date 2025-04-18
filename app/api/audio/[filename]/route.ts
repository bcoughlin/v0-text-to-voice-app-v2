import { type NextRequest, NextResponse } from "next/server"
import { VoiceGenerator } from "elevenlabs-node"
import { getServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename

    // Extract the message ID from the filename (assuming format: message_[id].mp3)
    const messageIdMatch = filename.match(/message_(.+)\.mp3/)
    if (!messageIdMatch) {
      return NextResponse.json({ error: "Invalid filename format" }, { status: 400 })
    }

    const messageId = messageIdMatch[1]

    // Get the message from the database
    const supabase = getServerClient()
    const { data: message, error } = await supabase.from("messages").select("*").eq("id", messageId).single()

    if (error || !message) {
      console.error("Audio Error: Message not found", error)
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Get the voice parameter from the query string or use a default
    const searchParams = request.nextUrl.searchParams
    const voice = searchParams.get("voice") || "Rachel"

    // Generate the audio using ElevenLabs
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 })
    }

    // Initialize ElevenLabs Voice Generator
    const voiceGenerator = new VoiceGenerator({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    // Generate speech using ElevenLabs
    const audioResponse = await voiceGenerator.generateVoice(message.body, getElevenLabsVoiceId(voice))

    // Return the audio file
    return new NextResponse(Buffer.from(audioResponse), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating audio:", error)
    return NextResponse.json({ error: error.message || "Failed to generate audio" }, { status: 500 })
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
    // Default to Rachel if voice not found
    default: "21m00Tcm4TlvDq8ikWAM",
  }

  return voiceMap[voice] || voiceMap["default"]
}
