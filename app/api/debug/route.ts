import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get environment variables (redacted for security)
    const envVars = {
      VERCEL_URL: process.env.VERCEL_URL ? "Set" : "Not set",
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL ? "Set" : "Not set",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? "Set" : "Not set",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID
        ? "Set (first 4 chars: " + process.env.TWILIO_ACCOUNT_SID.substring(0, 4) + "...)"
        : "Not set",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
        ? "Set (length: " + process.env.TWILIO_AUTH_TOKEN.length + ")"
        : "Not set",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
        ? "Set (length: " + process.env.OPENAI_API_KEY.length + ")"
        : "Not set",
      SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Not set",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        ? "Set (length: " + process.env.SUPABASE_ANON_KEY.length + ")"
        : "Not set",
    }

    // Get the last 5 messages
    const supabase = getServerClient()
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch messages", details: error }, { status: 500 })
    }

    // Redact sensitive information
    const redactedMessages = messages.map((msg) => ({
      ...msg,
      to_number: msg.to_number ? `${msg.to_number.substring(0, 5)}...` : null,
    }))

    // Get the base URL
    let baseUrl
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    } else {
      baseUrl = "Unknown"
    }

    return NextResponse.json({
      environment: envVars,
      baseUrl,
      recentMessages: redactedMessages,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred", details: String(error) }, { status: 500 })
  }
}
