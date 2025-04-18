"use server"

import { getServerClient } from "@/lib/supabase"

export async function getMessages() {
  const supabase = getServerClient()
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data || []
}

export async function getVoiceSettings() {
  const supabase = getServerClient()
  const { data, error } = await supabase.from("voice_settings").select("*")

  if (error) {
    console.error("Error fetching voice settings:", error)
    return []
  }

  return data || []
}
