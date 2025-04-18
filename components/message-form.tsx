"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { makeCall } from "@/app/actions/make-call"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "@/components/character-counter"
import { PhoneInput } from "@/components/phone-input"
import { VoiceSettings } from "@/components/voice-settings"
import type { VoiceSetting, OpenAIModel, VoiceProvider } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface MessageFormProps {
  voiceSettings: VoiceSetting[]
}

export function MessageForm({ voiceSettings }: MessageFormProps) {
  const [message, setMessage] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [voice, setVoice] = useState<string>("alloy")
  const [model, setModel] = useState<OpenAIModel>("tts-1")
  const [provider, setProvider] = useState<VoiceProvider>("openai")
  const [agentId, setAgentId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Get search params safely in a useEffect to avoid SSR issues
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only run on the client side
    if (searchParams) {
      const phone = searchParams.get("phone")
      if (phone) {
        setPhoneNumber(phone)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For agent calls, we don't need a message
    if (provider !== "elevenlabs-agent" && !message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter a message to send",
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number is required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    // For agent calls, we need an agent ID
    if (provider === "elevenlabs-agent" && !agentId.trim()) {
      toast({
        title: "Agent ID is required",
        description: "Please enter your ElevenLabs Agent ID",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("message", message)
    formData.append("phoneNumber", phoneNumber)
    formData.append("voiceName", voice)
    formData.append("voiceModel", model)
    formData.append("voiceProvider", provider)

    if (provider === "elevenlabs-agent") {
      formData.append("agentId", agentId)
    }

    try {
      const result = await makeCall(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description:
            provider === "elevenlabs-agent"
              ? "Your call with the AI agent has been initiated"
              : "Your voice call has been initiated",
        })

        // Reset form
        setMessage("")
        setPhoneNumber("")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {provider !== "elevenlabs-agent" && (
        <div className="space-y-2">
          <CharacterCounter value={message} onChange={setMessage} maxLength={300} />
        </div>
      )}

      <div className="space-y-2">
        <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
      </div>

      <div className="space-y-2">
        <VoiceSettings
          voiceSettings={voiceSettings}
          defaultVoice={voice}
          defaultModel={model}
          defaultProvider={provider}
          defaultAgentId={agentId}
          onVoiceChange={setVoice}
          onModelChange={setModel}
          onProviderChange={setProvider}
          onAgentIdChange={setAgentId}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {provider === "elevenlabs-agent" ? "Initiating agent call..." : "Initiating call..."}
          </>
        ) : provider === "elevenlabs-agent" ? (
          "Start Agent Call"
        ) : (
          "Make Voice Call"
        )}
      </Button>
    </form>
  )
}
