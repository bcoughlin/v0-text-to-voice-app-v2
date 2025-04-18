"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Hardcoded base URL to ensure consistency
const BASE_URL = "https://talkto.brad.llc"

export async function makeQuickCall(phoneNumber: string) {
  console.log("Starting makeQuickCall server action")
  const supabase = getServerClient()

  // Predefined message
  const body = "Hello. You just requested I call you from Brad's website. Hope you are doing great today. Cheers!"
  const voiceName = "alloy" // Default voice
  const voiceModel = "tts-1" // Default model

  // Validate input
  if (!phoneNumber) {
    console.error("Validation error: Phone number is required")
    return { error: "Phone number is required" }
  }

  // Format phone number (simple US format validation)
  const formattedNumber = phoneNumber.replace(/\D/g, "")
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
        body,
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
      // Create webhook URLs using hardcoded base URL
      const twimlUrl = `${BASE_URL}/api/twiml?messageId=${message.id}&voice=${voiceName}`
      console.log("TwiML URL:", twimlUrl)

      const statusCallbackUrl = `${BASE_URL}/api/call-status?messageId=${message.id}`
      console.log("Status callback URL:", statusCallbackUrl)

      // Verify Twilio phone number is set
      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER environment variable is not set")
      }

      // Make the call using our API route instead of direct Twilio SDK
      console.log("Initiating Twilio call via API route...")
      const response = await fetch(`${BASE_URL}/api/make-call`, {
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
      revalidatePath("/")
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
      revalidatePath("/")
      return { error: error.message || "Failed to make call" }
    }
  } catch (error: any) {
    console.error("Database error:", error)
    return { error: error.message || "Failed to create message" }
  }
}
