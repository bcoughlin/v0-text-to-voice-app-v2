"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { makeCall } from "@/app/actions/make-call"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "@/components/character-counter"
import { PhoneInput } from "@/components/phone-input"
import { VoiceSettings } from "@/components/voice-settings"
import type { VoiceSetting, OpenAIVoice, OpenAIModel } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface MessageFormProps {
  voiceSettings: VoiceSetting[]
}

export function MessageForm({ voiceSettings }: MessageFormProps) {
  const searchParams = useSearchParams()
  const initialPhoneNumber = searchParams.get("phone") || ""

  const [message, setMessage] = useState("")
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [voice, setVoice] = useState<OpenAIVoice>("alloy")
  const [model, setModel] = useState<OpenAIModel>("tts-1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Update phone number if the query parameter changes
  useEffect(() => {
    if (initialPhoneNumber) {
      setPhoneNumber(initialPhoneNumber)
    }
  }, [initialPhoneNumber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
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

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("message", message)
    formData.append("phoneNumber", phoneNumber)
    formData.append("voiceName", voice)
    formData.append("voiceModel", model)

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
          description: "Your voice call has been initiated",
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
      <div className="space-y-2">
        <CharacterCounter value={message} onChange={setMessage} maxLength={300} />
      </div>

      <div className="space-y-2">
        <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
      </div>

      <div className="space-y-2">
        <VoiceSettings
          voiceSettings={voiceSettings}
          defaultVoice={voice}
          defaultModel={model}
          onVoiceChange={setVoice}
          onModelChange={setModel}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initiating call...
          </>
        ) : (
          "Make Voice Call"
        )}
      </Button>
    </form>
  )
}
