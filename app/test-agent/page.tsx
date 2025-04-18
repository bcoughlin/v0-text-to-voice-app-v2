"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestAgentPage() {
  const [agentId, setAgentId] = useState(process.env.ELEVENLABS_DEFAULT_AGENT_ID || "")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const initializeConversation = async () => {
    if (!agentId.trim()) {
      toast({
        title: "Agent ID is required",
        description: "Please enter your ElevenLabs Agent ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/elevenlabs-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
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
      setMessages([{ role: "assistant", content: data.message }])

      // Play audio if available
      if (data.audio && audioRef.current) {
        audioRef.current.src = data.audio
        audioRef.current.play()
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
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!conversationId) {
      initializeConversation()
      return
    }

    if (!userInput.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your message to the agent",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Add user message to the conversation
    setMessages((prev) => [...prev, { role: "user", content: userInput }])

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
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])

      // Clear user input
      setUserInput("")

      // Play audio if available
      if (data.audio && audioRef.current) {
        audioRef.current.src = data.audio
        audioRef.current.play()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Test ElevenLabs Agent</h1>
        <p className="text-muted-foreground mt-2">Test your ElevenLabs conversational agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Conversation</CardTitle>
          <CardDescription>
            {conversationId
              ? "Chat with your ElevenLabs agent"
              : "Enter your ElevenLabs Agent ID to start a conversation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!conversationId ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent ID</label>
                <Input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter your ElevenLabs Agent ID"
                />
                <p className="text-xs text-gray-500">
                  You can find your Agent ID in the ElevenLabs dashboard under Projects.
                </p>
              </div>
              <Button onClick={initializeConversation} disabled={isLoading || !agentId.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Start Conversation"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md p-4 h-[300px] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
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

              <div className="flex space-x-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <Button size="icon" onClick={sendMessage} disabled={isLoading || !userInput.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
