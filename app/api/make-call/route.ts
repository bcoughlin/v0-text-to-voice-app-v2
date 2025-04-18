import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import twilio from "twilio"

// Initialize Twilio client in a way that avoids prototype issues
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured")
  }

  // Use dynamic import to avoid prototype issues
  return twilio(accountSid, authToken)
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { to, from, url, statusCallback, messageId } = body

    if (!to || !from || !url || !messageId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log("Making Twilio call with parameters:", { to, from, url, statusCallback, messageId })

    try {
      // Get Twilio client
      const client = getTwilioClient()

      // Make the call
      const call = await client.calls.create({
        to,
        from,
        url,
        statusCallback,
        statusCallbackMethod: "POST",
      })

      console.log("Twilio call created:", { sid: call.sid })

      return NextResponse.json({
        success: true,
        sid: call.sid,
      })
    } catch (error: any) {
      console.error("Error making Twilio call:", error)

      // Update message status to failed
      const supabase = getServerClient()
      await supabase
        .from("messages")
        .update({
          status: "failed",
          error: error.message || "Failed to make call",
        })
        .eq("id", messageId)

      return NextResponse.json(
        {
          error: error.message || "Failed to make Twilio call",
        },
        {
          status: 500,
        },
      )
    }
  } catch (error: any) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred",
      },
      {
        status: 500,
      },
    )
  }
}
