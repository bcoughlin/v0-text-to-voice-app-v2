import { type NextRequest, NextResponse } from "next/server"
import { Voice } from "elevenlabs-node"
import { createClient } from "@supabase/supabase-js"

// Hardcoded base URL to ensure consistency
const BASE_URL = "https://talkto.brad.llc"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const getServerClient = () => createClient(supabaseUrl, supabaseKey)

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

    // Initialize ElevenLabs Voice
    const elevenLabsVoice = new Voice({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: getElevenLabsVoiceId(voice),
    })

    // Generate speech using ElevenLabs
    const audioResponse = await elevenLabsVoice.textToSpeech(message.body)

    // Return the audio file
    return new NextResponse(audioResponse, {
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
