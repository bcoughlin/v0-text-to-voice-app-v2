"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "@/components/character-counter"
import { VoiceSettings } from "@/components/voice-settings"
import type { VoiceSetting, OpenAIModel, VoiceProvider } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Square } from "lucide-react"

interface VoiceTestProps {
  voiceSettings: VoiceSetting[]
}

export function VoiceTest({ voiceSettings }: VoiceTestProps) {
  const [message, setMessage] = useState("")
  const [voice, setVoice] = useState<string>("alloy")
  const [model, setModel] = useState<OpenAIModel>("tts-1")
  const [provider, setProvider] = useState<VoiceProvider>("openai")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
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
      // Choose the appropriate API endpoint based on the provider
      const endpoint = provider === "openai" ? "/api/text-to-speech" : "/api/elevenlabs-tts"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          voice,
          model: provider === "openai" ? model : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to generate speech with ${provider}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlaying(true)
      }

      toast({
        title: "Success",
        description: "Voice generated successfully",
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

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
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
          defaultProvider={provider}
          onVoiceChange={setVoice}
          onModelChange={setModel}
          onProviderChange={setProvider}
        />
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleGenerate} disabled={isGenerating || !message.trim()} className="flex-1">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Voice"
          )}
        </Button>

        {(isPlaying || audioRef.current?.src) && (
          <Button variant="outline" size="icon" onClick={handlePlayPause} disabled={isGenerating}>
            {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  )
}
