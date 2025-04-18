import { NextResponse } from "next/server"
import { createWebhookUrl } from "@/lib/url-utils"

export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_DEFAULT_AGENT_ID

    if (!agentId) {
      return NextResponse.json({ error: "ELEVENLABS_DEFAULT_AGENT_ID is not set" }, { status: 500 })
    }

    // Create the TwiML conversation URL
    const twimlUrl = createWebhookUrl("/api/twiml-conversation", { agentId })

    // Test the TwiML conversation endpoint
    const response = await fetch(twimlUrl, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: "Failed to test TwiML conversation endpoint",
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
        },
        { status: 500 },
      )
    }

    const twimlResponse = await response.text()

    return NextResponse.json({
      success: true,
      twimlUrl,
      twimlResponse,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
