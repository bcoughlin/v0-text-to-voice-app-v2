"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "@/components/character-counter"
import { VoiceSettings } from "@/components/voice-settings"
import type { VoiceSetting, OpenAIVoice, OpenAIModel } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface VoiceTestProps {
  voiceSettings: VoiceSetting[]
}

export function VoiceTest({ voiceSettings }: VoiceTestProps) {
  const [message, setMessage] = useState("")
  const [voice, setVoice] = useState<OpenAIVoice>("alloy")
  const [model, setModel] = useState<OpenAIModel>("tts-1")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter a message to test",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      toast({
        title: "Feature temporarily disabled",
        description: "Voice testing is currently being updated",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <CharacterCounter value={message} onChange={setMessage} maxLength={300} />
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

      <Button onClick={handleGenerate} disabled={isGenerating || !message.trim()} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Voice"
        )}
      </Button>
    </div>
  )
}
