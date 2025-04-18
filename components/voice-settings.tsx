"use client"

import { useState } from "react"
import type { VoiceSetting, OpenAIVoice, OpenAIModel } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface VoiceSettingsProps {
  voiceSettings: VoiceSetting[]
  defaultVoice?: OpenAIVoice
  defaultModel?: OpenAIModel
  onVoiceChange: (voice: OpenAIVoice) => void
  onModelChange: (model: OpenAIModel) => void
}

export function VoiceSettings({
  voiceSettings,
  defaultVoice = "alloy",
  defaultModel = "tts-1",
  onVoiceChange,
  onModelChange,
}: VoiceSettingsProps) {
  const [voice, setVoice] = useState<OpenAIVoice>(defaultVoice)
  const [model, setModel] = useState<OpenAIModel>(defaultModel)

  const handleVoiceChange = (value: string) => {
    const newVoice = value as OpenAIVoice
    setVoice(newVoice)
    onVoiceChange(newVoice)
  }

  const handleModelChange = (value: string) => {
    const newModel = value as OpenAIModel
    setModel(newModel)
    onModelChange(newModel)
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}
