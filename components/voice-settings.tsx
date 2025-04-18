"use client"

import { useState } from "react"
import type { VoiceSetting, OpenAIModel, VoiceProvider } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface VoiceSettingsProps {
  voiceSettings: VoiceSetting[]
  defaultVoice?: string
  defaultModel?: OpenAIModel
  defaultProvider?: VoiceProvider
  onVoiceChange: (voice: string) => void
  onModelChange: (model: OpenAIModel) => void
  onProviderChange: (provider: VoiceProvider) => void
}

export function VoiceSettings({
  voiceSettings,
  defaultVoice = "alloy",
  defaultModel = "tts-1",
  defaultProvider = "openai",
  onVoiceChange,
  onModelChange,
  onProviderChange,
}: VoiceSettingsProps) {
  const [voice, setVoice] = useState<string>(defaultVoice)
  const [model, setModel] = useState<OpenAIModel>(defaultModel)
  const [provider, setProvider] = useState<VoiceProvider>(defaultProvider)

  const handleVoiceChange = (value: string) => {
    setVoice(value)
    onVoiceChange(value)
  }

  const handleModelChange = (value: string) => {
    const newModel = value as OpenAIModel
    setModel(newModel)
    onModelChange(newModel)
  }

  const handleProviderChange = (value: string) => {
    const newProvider = value as VoiceProvider
    setProvider(newProvider)
    onProviderChange(newProvider)

    // Set default voice for the selected provider
    if (newProvider === "openai") {
      setVoice("alloy")
      onVoiceChange("alloy")
    } else if (newProvider === "elevenlabs") {
      setVoice("Adam")
      onVoiceChange("Adam")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voice Provider</Label>
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {provider === "openai" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={voice} onValueChange={handleVoiceChange}>
              <SelectTrigger id="voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
                <SelectItem value="fable">Fable</SelectItem>
                <SelectItem value="onyx">Onyx</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="shimmer">Shimmer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tts-1">Standard (tts-1)</SelectItem>
                <SelectItem value="tts-1-hd">High Definition (tts-1-hd)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {provider === "elevenlabs" && (
        <div className="space-y-2">
          <Label htmlFor="voice">Voice</Label>
          <Select value={voice} onValueChange={handleVoiceChange}>
            <SelectTrigger id="voice">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Adam">Adam</SelectItem>
              <SelectItem value="Antoni">Antoni</SelectItem>
              <SelectItem value="Arnold">Arnold</SelectItem>
              <SelectItem value="Bella">Bella</SelectItem>
              <SelectItem value="Domi">Domi</SelectItem>
              <SelectItem value="Elli">Elli</SelectItem>
              <SelectItem value="Josh">Josh</SelectItem>
              <SelectItem value="Rachel">Rachel</SelectItem>
              <SelectItem value="Sam">Sam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
