import { NextResponse } from "next/server"
import twilio from "twilio"

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    try {
      // Just test if we can create a client without errors
      const client = twilio(accountSid, authToken)

      // Try to fetch account info to verify credentials
      const account = await client.api.accounts(accountSid).fetch()

      return NextResponse.json({
        success: true,
        accountStatus: account.status,
        accountName: account.friendlyName,
      })
    } catch (error: any) {
      console.error("Twilio client error:", error)
      return NextResponse.json({ error: error.message || "Failed to initialize Twilio client" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
