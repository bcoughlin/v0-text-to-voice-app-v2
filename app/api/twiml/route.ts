import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

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

    // For ElevenLabs, we'll use Twilio's built-in TTS for now
    // Map voice to Twilio voice
    let twilioVoice = "alice"
    if (provider === "elevenlabs") {
      // Map ElevenLabs voices to Twilio voices (simple mapping)
      if (voice === "Adam" || voice === "Antoni" || voice === "Arnold" || voice === "Josh" || voice === "Sam") {
        twilioVoice = "man"
      } else if (voice === "Bella" || voice === "Domi" || voice === "Elli" || voice === "Rachel") {
        twilioVoice = "woman"
      }
    } else {
      // Map OpenAI voices to Twilio voices
      if (voice === "alloy" || voice === "echo") twilioVoice = "alice"
      if (voice === "fable" || voice === "onyx") twilioVoice = "man"
      if (voice === "nova" || voice === "shimmer") twilioVoice = "woman"
    }

    // Generate TwiML to play the audio
    const escapedMessage = message.body.replace(/[<>&]/g, (c) => {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c
    })

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${twilioVoice}">${escapedMessage}</Say>
</Response>`

    console.log("Generated TwiML response")
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
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
