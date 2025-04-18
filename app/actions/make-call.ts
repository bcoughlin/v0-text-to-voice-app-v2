"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { createWebhookUrl } from "@/lib/url-utils"

export async function makeCall(formData: FormData) {
  console.log("Starting makeCall server action")
  const supabase = getServerClient()

  // Get form data
  const body = formData.get("message") as string
  const toNumber = formData.get("phoneNumber") as string
  const voiceName = (formData.get("voiceName") as string) || "alloy"
  const voiceModel = (formData.get("voiceModel") as string) || "tts-1"
  const voiceProvider = (formData.get("voiceProvider") as string) || "openai"
  const agentId = formData.get("agentId") as string

  // Validate input
  if (voiceProvider !== "elevenlabs-agent" && (!body || !toNumber)) {
    console.error("Validation error: Message and phone number are required")
    return { error: "Message and phone number are required" }
  }

  if (voiceProvider === "elevenlabs-agent" && !toNumber) {
    console.error("Validation error: Phone number is required")
    return { error: "Phone number is required" }
  }

  // For agent calls, use default agent ID if not provided
  const effectiveAgentId =
    voiceProvider === "elevenlabs-agent" ? agentId || process.env.ELEVENLABS_DEFAULT_AGENT_ID : null

  if (voiceProvider === "elevenlabs-agent" && !effectiveAgentId) {
    console.error("Validation error: No agent ID provided or configured")
    return { error: "No agent ID provided or configured" }
  }

  if (voiceProvider !== "elevenlabs-agent" && body.length > 300) {
    console.error("Validation error: Message too long", { length: body.length })
    return { error: "Message must be 300 characters or less" }
  }

  // Format phone number (simple US format validation)
  const formattedNumber = toNumber.replace(/\D/g, "")
  if (formattedNumber.length !== 10 && formattedNumber.length !== 11) {
    console.error("Validation error: Invalid phone number format", { number: formattedNumber })
    return { error: "Invalid phone number format" }
  }

  // Ensure US number has country code
  const fullPhoneNumber = formattedNumber.length === 10 ? `+1${formattedNumber}` : `+${formattedNumber}`
  console.log("Formatted phone number:", fullPhoneNumber)

  try {
    // Create a new message in the database with pending status
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        body: voiceProvider === "elevenlabs-agent" ? "AI Agent Conversation" : body,
        to_number: fullPhoneNumber,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error when creating message:", error)
      throw error
    }

    console.log("Message created in database:", { messageId: message.id })

    try {
      // Create webhook URLs based on provider
      let twimlUrl

      if (voiceProvider === "elevenlabs-agent") {
        // For agent calls, use the conversation TwiML endpoint
        twimlUrl = createWebhookUrl("/api/twiml-conversation", {
          agentId: effectiveAgentId as string,
        })
      } else {
        // For regular calls, use the standard TwiML endpoint
        twimlUrl = createWebhookUrl("/api/twiml", {
          messageId: message.id,
          voice: voiceName,
          provider: voiceProvider,
        })
      }

      console.log("TwiML URL:", twimlUrl)

      const statusCallbackUrl = createWebhookUrl("/api/call-status", {
        messageId: message.id,
      })
      console.log("Status callback URL:", statusCallbackUrl)

      // Verify Twilio phone number is set
      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER environment variable is not set")
      }

      // Make the call using our API route
      console.log("Initiating Twilio call via API route...")
      const response = await fetch(createWebhookUrl("/api/make-call"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: fullPhoneNumber,
          from: process.env.TWILIO_PHONE_NUMBER,
          url: twimlUrl,
          statusCallback: statusCallbackUrl,
          messageId: message.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to make call")
      }

      const result = await response.json()
      console.log("Twilio call initiated successfully:", { callSid: result.sid })

      // Update message status and SID
      await supabase
        .from("messages")
        .update({
          status: "in-progress",
          sid: result.sid,
        })
        .eq("id", message.id)

      console.log("Message status updated to in-progress")
      revalidatePath("/text-to-voice")
      return { success: true, message }
    } catch (error: any) {
      console.error("Twilio error:", error)

      // Update message status to failed
      await supabase
        .from("messages")
        .update({
          status: "failed",
          error: error.message || "Failed to make call",
        })
        .eq("id", message.id)

      console.log("Message status updated to failed")
      revalidatePath("/text-to-voice")
      return { error: error.message || "Failed to make call" }
    }
  } catch (error: any) {
    console.error("Database error:", error)
    return { error: error.message || "Failed to create message" }
  }
}
