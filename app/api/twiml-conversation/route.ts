import { type NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/url-utils"

// Handle all HTTP methods
export async function GET(request: NextRequest) {
  return handleTwiMLRequest(request)
}

export async function POST(request: NextRequest) {
  return handleTwiMLRequest(request)
}

// Add support for other methods that Twilio might use
export const PUT = GET
export const DELETE = GET
export const PATCH = GET
export const HEAD = GET
export const OPTIONS = GET

// Common handler for all HTTP methods
async function handleTwiMLRequest(request: NextRequest) {
  try {
    console.log("TwiML Conversation endpoint called with method:", request.method)
    console.log("TwiML Conversation URL:", request.url)
    console.log("TwiML Conversation search params:", Object.fromEntries(request.nextUrl.searchParams))

    // Get parameters
    let callSid, userInput, conversationId

    if (request.method === "POST") {
      try {
        // For POST requests, get data from form
        const formData = await request.formData()
        console.log("TwiML Conversation form data keys:", [...formData.keys()])

        callSid = formData.get("CallSid") as string
        userInput = formData.get("SpeechResult") as string
        conversationId = formData.get("conversationId") as string

        console.log("TwiML Conversation received form data:", {
          callSid,
          userInput,
          conversationId,
        })
      } catch (error) {
        console.error("Error parsing form data:", error)
      }
    }

    // For all requests, also check query params (Twilio sometimes uses these)
    const searchParams = request.nextUrl.searchParams
    callSid = callSid || searchParams.get("CallSid")
    userInput = userInput || searchParams.get("SpeechResult")
    conversationId = conversationId || searchParams.get("conversationId")

    const agentId = searchParams.get("agentId") || process.env.ELEVENLABS_DEFAULT_AGENT_ID

    if (!agentId) {
      console.error("TwiML Conversation Error: Missing agentId parameter")
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Sorry, there was an error with the agent ID parameter.</Say>
          <Hangup/>
        </Response>`,
        {
          headers: {
            "Content-Type": "text/xml",
          },
        },
      )
    }

    // Get the base URL for API calls
    const baseUrl = getBaseUrl()

    // If this is the first interaction (no conversationId), initialize the conversation
    if (!conversationId) {
      try {
        console.log("Initializing new conversation with agent ID:", agentId)
        // Call our API to initialize the conversation
        const response = await fetch(`${baseUrl}/api/elevenlabs-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId,
            callSid: callSid || `test-call-${Date.now()}`,
            userInput: null, // No user input for initial greeting
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error initializing conversation:", errorData)
          throw new Error("Failed to initialize conversation")
        }

        const data = await response.json()
        conversationId = data.conversationId
        console.log("Conversation initialized with ID:", conversationId)

        // Generate TwiML for initial greeting
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${data.message}</Say>
  <Gather input="speech" timeout="5" action="${baseUrl}/api/twiml-conversation?agentId=${agentId}&amp;conversationId=${conversationId}" method="POST">
    <Say>Please speak after the beep.</Say>
  </Gather>
</Response>`

        return new NextResponse(twiml, {
          headers: {
            "Content-Type": "text/xml",
          },
        })
      } catch (error) {
        console.error("Error initializing conversation:", error)
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Sorry, there was an error initializing the conversation.</Say>
            <Hangup/>
          </Response>`,
          {
            headers: {
              "Content-Type": "text/xml",
            },
          },
        )
      }
    }

    // If we have user input and conversationId, continue the conversation
    if (userInput && conversationId) {
      try {
        console.log("Continuing conversation:", { conversationId, userInput })
        // Call our API to get agent response
        const response = await fetch(`${baseUrl}/api/elevenlabs-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            userInput,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error getting agent response:", errorData)
          throw new Error("Failed to get agent response")
        }

        const data = await response.json()
        console.log("Received agent response:", data.message)

        // Generate TwiML for agent response
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${data.message}</Say>
  <Gather input="speech" timeout="5" action="${baseUrl}/api/twiml-conversation?agentId=${agentId}&amp;conversationId=${conversationId}" method="POST">
    <Say>Please speak after the beep.</Say>
  </Gather>
</Response>`

        return new NextResponse(twiml, {
          headers: {
            "Content-Type": "text/xml",
          },
        })
      } catch (error) {
        console.error("Error getting agent response:", error)
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Sorry, there was an error processing your request.</Say>
            <Hangup/>
          </Response>`,
          {
            headers: {
              "Content-Type": "text/xml",
            },
          },
        )
      }
    }

    // If we don't have user input, prompt for it
    console.log("No user input detected, prompting for speech")
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" timeout="5" action="${baseUrl}/api/twiml-conversation?agentId=${agentId}&amp;conversationId=${conversationId || ""}" method="POST">
          <Say>I didn't catch that. Please speak after the beep.</Say>
        </Gather>
      </Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  } catch (error) {
    console.error("TwiML Conversation Error:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Sorry, an unexpected error occurred.</Say>
        <Hangup/>
      </Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  }
}
