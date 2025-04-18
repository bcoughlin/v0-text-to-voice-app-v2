"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CharacterCounter } from "@/components/character-counter"
import { VoiceSettings } from "@/components/voice-settings"
import type { VoiceSetting, OpenAIModel, VoiceProvider } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Square, Send } from "lucide-react"
import { Input } from "@/components/ui/input"

interface VoiceTestProps {
  voiceSettings: VoiceSetting[]
}

export function VoiceTest({ voiceSettings }: VoiceTestProps) {
  const [message, setMessage] = useState("")
  const [voice, setVoice] = useState<string>("alloy")
  const [model, setModel] = useState<OpenAIModel>("tts-1")
  const [provider, setProvider] = useState<VoiceProvider>("openai")
  const [agentId, setAgentId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [agentMessages, setAgentMessages] = useState<{ role: string; content: string }[]>([])
  const [userInput, setUserInput] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [agentMessages])

  const handleGenerate = async () => {
    if (provider === "elevenlabs-agent") {
      await handleAgentInteraction()
      return
    }

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

  const handleAgentInteraction = async () => {
    if (provider !== "elevenlabs-agent") return

    if (!agentId.trim() && !process.env.ELEVENLABS_DEFAULT_AGENT_ID) {
      toast({
        title: "Agent ID is required",
        description: "Please enter your ElevenLabs Agent ID",
        variant: "destructive",
      })
      return
    }

    // For initial greeting, we don't need user input
    if (!conversationId && userInput.trim() === "") {
      setIsGenerating(true)
      try {
        const response = await fetch("/api/elevenlabs-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: agentId || process.env.ELEVENLABS_DEFAULT_AGENT_ID,
            callSid: "test-call-" + Date.now(),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to initialize agent conversation")
        }

        const data = await response.json()
        setConversationId(data.conversationId)

        // Add agent's greeting to messages
        setAgentMessages([{ role: "assistant", content: data.message }])

        // Play audio if available
        if (data.audio && audioRef.current) {
          audioRef.current.src = data.audio
          audioRef.current.play()
          setIsPlaying(true)
        }

        toast({
          title: "Success",
          description: "Agent conversation initialized",
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
      return
    }

    // For continuing conversation, we need user input
    if (conversationId && userInput.trim() === "") {
      toast({
        title: "Input required",
        description: "Please enter your message to the agent",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Add user message to the conversation
    setAgentMessages((prev) => [...prev, { role: "user", content: userInput }])

    try {
      const response = await fetch("/api/elevenlabs-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          userInput,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get agent response")
      }

      const data = await response.json()

      // Add agent's response to messages
      setAgentMessages((prev) => [...prev, { role: "assistant", content: data.message }])

      // Clear user input
      setUserInput("")

      // Play audio if available
      if (data.audio && audioRef.current) {
        audioRef.current.src = data.audio
        audioRef.current.play()
        setIsPlaying(true)
      }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAgentInteraction()
    }
  }

  return (
    <div className="space-y-6">
      {provider !== "elevenlabs-agent" ? (
        <div className="space-y-2">
          <CharacterCounter value={message} onChange={setMessage} maxLength={300} />
        </div>
      ) : (
        <div className="space-y-4">
          {conversationId && (
            <div className="border rounded-md p-4 h-[200px] overflow-y-auto">
              <div className="space-y-4">
                {agentMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {conversationId && (
            <div className="flex space-x-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isGenerating}
              />
              <Button size="icon" onClick={handleAgentInteraction} disabled={isGenerating || !userInput.trim()}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      )}

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

      <div className="flex space-x-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (provider !== "elevenlabs-agent" && !message.trim())}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {provider === "elevenlabs-agent" ? "Processing..." : "Generating..."}
            </>
          ) : provider === "elevenlabs-agent" ? (
            conversationId ? (
              "Send Message"
            ) : (
              "Start Conversation"
            )
          ) : (
            "Generate Voice"
          )}
        </Button>

        {!provider.includes("agent") && (isPlaying || audioRef.current?.src) && (
          <Button variant="outline" size="icon" onClick={handlePlayPause} disabled={isGenerating}>
            {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  )
}
