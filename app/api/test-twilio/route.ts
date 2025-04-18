import { type NextRequest, NextResponse } from "next/server"

// Hardcoded base URL to ensure consistency
const BASE_URL = "https://talkto.brad.llc"

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const envVars = {
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "Not set",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID
        ? process.env.TWILIO_ACCOUNT_SID.substring(0, 4) + "..."
        : "Not set",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
        ? "Set (length: " + process.env.TWILIO_AUTH_TOKEN.length + ")"
        : "Not set",
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "Not set",
      VERCEL_URL: process.env.VERCEL_URL || "Not set",
    }

    // Create a test TwiML URL using hardcoded base URL
    const twimlUrl = `${BASE_URL}/api/twiml?messageId=test&voice=alloy`

    // Test Twilio account
    let twilioAccountValid = false
    let twilioError = null

    try {
      // Make a simple request to test the Twilio credentials
      const response = await fetch(`${BASE_URL}/api/make-call/test`, {
        method: "GET",
      })

      if (response.ok) {
        twilioAccountValid = true
      } else {
        const errorData = await response.json()
        twilioError = errorData.error
      }
    } catch (error: any) {
      twilioError = error.message
    }

    return NextResponse.json({
      environment: envVars,
      baseUrl: BASE_URL,
      twimlUrl,
      twilioAccountValid,
      twilioError,
      serverTime: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
