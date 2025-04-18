import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

// Handle GET requests (for testing in browser)
export async function GET(request: NextRequest) {
  return handleCallStatusRequest(request)
}

// Handle POST requests (from Twilio)
export async function POST(request: NextRequest) {
  return handleCallStatusRequest(request)
}

// Common handler for both GET and POST
async function handleCallStatusRequest(request: NextRequest) {
  try {
    console.log("Call status endpoint called with method:", request.method)

    let callStatus, callSid

    // Extract data based on request method
    if (request.method === "POST") {
      const formData = await request.formData()
      callStatus = formData.get("CallStatus") as string
      callSid = formData.get("CallSid") as string
      console.log("Call status update received from form data:", { callStatus, callSid })
    } else {
      // For GET requests, try to get from query params (for testing)
      callStatus = request.nextUrl.searchParams.get("CallStatus") as string
      callSid = request.nextUrl.searchParams.get("CallSid") as string
      console.log("Call status update received from query params:", { callStatus, callSid })
    }

    const messageId = request.nextUrl.searchParams.get("messageId")

    if (!messageId || !callStatus) {
      console.error("Missing required parameters:", { messageId, callStatus })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Map Twilio call status to our status
    let status = "unknown"
    let error = null

    switch (callStatus) {
      case "completed":
        status = "completed"
        break
      case "busy":
      case "failed":
      case "no-answer":
      case "canceled":
        status = "failed"
        error = `Call ${callStatus}`
        break
      case "in-progress":
      case "queued":
      case "ringing":
        status = "in-progress"
        break
      default:
        status = "unknown"
    }

    // Update the message status
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        status,
        error,
        sid: callSid,
      })
      .eq("id", messageId)

    if (updateError) {
      console.error("Error updating message status:", updateError)
      return NextResponse.json({ error: "Failed to update message status" }, { status: 500 })
    }

    console.log("Message status updated successfully:", { messageId, status })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing call status:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
