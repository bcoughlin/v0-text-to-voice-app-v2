import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

// Define BASE_URL at the top of the file
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// Handle GET requests (for testing in browser)
export async function GET(request: NextRequest) {
  return handleTwiMLRequest(request)
}

// Handle POST requests (from Twilio)
export async function POST(request: NextRequest) {
  return handleTwiMLRequest(request)
}

// Common handler for both GET and POST
async function handleTwiMLRequest(request: NextRequest) {
  try {
    console.log("TwiML endpoint called with method:", request.method)
    console.log("TwiML endpoint called with params:", Object.fromEntries(request.nextUrl.searchParams))

    // For POST requests, also log the form data
    if (request.method === "POST") {
      try {
        const formData = await request.formData()
        console.log("TwiML endpoint received form data:", Object.fromEntries(formData.entries()))
      } catch (error) {
        console.log("No form data in request")
      }
    }

    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get("messageId")
    const voice = searchParams.get("voice") || "alloy"
    const provider = searchParams.get("provider") || "openai"

    if (!messageId) {
      console.error("TwiML Error: Missing messageId parameter")
      // Return a valid TwiML response even in case of error
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Sorry, there was an error with the message ID parameter.</Say>
        </Response>`,
        {
          headers: {
            "Content-Type": "text/xml",
          },
        },
      )
    }

    // Get the message from the database
    const supabase = getServerClient()
    const { data: message, error } = await supabase.from("messages").select("*").eq("id", messageId).single()

    if (error || !message) {
      console.error("TwiML Error: Message not found", error)
      // Return a valid TwiML response even in case of error
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Sorry, the message could not be found.</Say>
        </Response>`,
        {
          headers: {
            "Content-Type": "text/xml",
          },
        },
      )
    }

    console.log("Message found:", { messageId, bodyLength: message.body.length })

    // Generate TwiML based on the provider
    if (provider === "elevenlabs") {
      // For ElevenLabs, we'll use Twilio's <Play> verb to play a pre-generated audio file
      // First, we need to generate the audio file using ElevenLabs API
      try {
        // Generate a unique filename for this message
        const audioFilename = `message_${messageId}.mp3`
        const audioUrl = `${BASE_URL}/api/audio/${audioFilename}`

        // Generate the audio file using ElevenLabs API and store it temporarily
        await generateAndStoreAudio(message.body, voice, audioFilename)

        // Return TwiML that plays the audio file
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`

        console.log("Generated TwiML response with ElevenLabs audio")
        return new NextResponse(twiml, {
          headers: {
            "Content-Type": "text/xml",
          },
        })
      } catch (error) {
        console.error("Error generating ElevenLabs audio:", error)
        // Fallback to standard Twilio TTS
        const twilioVoice = "alice" // Default fallback voice
        const escapedMessage = message.body.replace(/[<>&]/g, (c) => {
          return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c
        })

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${twilioVoice}">${escapedMessage}</Say>
</Response>`

        console.log("Generated fallback TwiML response")
        return new NextResponse(twiml, {
          headers: {
            "Content-Type": "text/xml",
          },
        })
      }
    } else {
      // For OpenAI, use Twilio's built-in TTS
      // Map OpenAI voice to Twilio voice
      let twilioVoice = "alice"
      if (voice === "alloy" || voice === "echo") twilioVoice = "alice"
      if (voice === "fable" || voice === "onyx") twilioVoice = "man"
      if (voice === "nova" || voice === "shimmer") twilioVoice = "woman"

      // Generate TwiML to play the audio
      const escapedMessage = message.body.replace(/[<>&]/g, (c) => {
        return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c
      })

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${twilioVoice}">${escapedMessage}</Say>
</Response>`

      console.log("Generated TwiML response with OpenAI voice mapping")
      return new NextResponse(twiml, {
        headers: {
          "Content-Type": "text/xml",
        },
      })
    }
  } catch (error) {
    console.error("TwiML Error:", error)
    // Return a valid TwiML response even in case of error
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Sorry, an unexpected error occurred.</Say>
      </Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  }
}

// Helper function to generate and store audio using ElevenLabs
async function generateAndStoreAudio(text: string, voice: string, filename: string) {
  // This is a placeholder function - in a real implementation, you would:
  // 1. Call the ElevenLabs API to generate the audio
  // 2. Store the audio file somewhere accessible (e.g., S3, Vercel Blob Storage)
  // 3. Return the URL to the stored audio file

  // For now, we'll just log that this would happen
  console.log(`Would generate audio for text: "${text}" with voice: ${voice} and store as ${filename}`)

  // In a real implementation, you would return the URL to the stored audio file
  return `https://example.com/audio/${filename}`
}
