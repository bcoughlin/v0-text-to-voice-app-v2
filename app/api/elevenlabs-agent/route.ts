import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import type { ConversationState, ConversationMessage } from "@/types"

export async function POST(request: NextRequest) {
  try {
    console.log("ElevenLabs agent API called")

    // Parse the request body
    const body = await request.json().catch((e) => {
      console.error("Error parsing request body:", e)
      return {}
    })

    const { agentId, callSid, userInput, conversationId } = body

    console.log("ElevenLabs agent request:", {
      agentId,
      callSid,
      userInput: userInput?.substring(0, 50),
      conversationId,
    })

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("ElevenLabs API key is not configured")
      return NextResponse.json({ error: "ElevenLabs API key is not configured" }, { status: 500 })
    }

    const effectiveAgentId = agentId || process.env.ELEVENLABS_DEFAULT_AGENT_ID

    if (!effectiveAgentId) {
      console.error("No agent ID provided or configured")
      return NextResponse.json({ error: "No agent ID provided or configured" }, { status: 400 })
    }

    // Get or create conversation state
    let conversationState: ConversationState | null = null

    if (conversationId) {
      // Get existing conversation
      console.log("Getting existing conversation:", conversationId)
      const supabase = getServerClient()
      const { data, error } = await supabase.from("conversations").select("*").eq("id", conversationId).single()

      if (error) {
        console.error("Error fetching conversation:", error)
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }

      conversationState = data as ConversationState
      console.log(
        "Found conversation with history length:",
        Array.isArray(conversationState.history) ? conversationState.history.length : 0,
      )
    } else if (callSid) {
      // Create new conversation
      console.log("Creating new conversation for call:", callSid)
      const supabase = getServerClient()
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          agent_id: effectiveAgentId,
          call_sid: callSid,
          history: [],
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating conversation:", error)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      conversationState = data as ConversationState
      console.log("Created new conversation with ID:", conversationState.id)
    } else {
      console.error("Missing required parameters: need either conversationId or callSid")
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Ensure history is an array
    if (!Array.isArray(conversationState.history)) {
      conversationState.history = []
    }

    // Add user input to conversation history if provided
    if (userInput) {
      console.log("Adding user input to conversation history")
      const history = [...conversationState.history]
      history.push({
        role: "user",
        content: userInput,
        timestamp: new Date().toISOString(),
      })

      // Update conversation history in database
      const supabase = getServerClient()
      await supabase
        .from("conversations")
        .update({
          history,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationState.id)

      conversationState.history = history
      console.log("Updated conversation history, new length:", history.length)
    }

    // Format history for ElevenLabs API
    const formattedHistory = conversationState.history.map((msg: ConversationMessage) => ({
      text: msg.content,
      sender: msg.role === "user" ? "Human" : "Assistant",
    }))

    console.log("Calling ElevenLabs API with history length:", formattedHistory.length)

    // Call ElevenLabs API to get agent response
    const response = await fetch(`https://api.elevenlabs.io/v1/projects/${effectiveAgentId}/talk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        history: formattedHistory,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
        generation_config: {
          temperature: 0.7,
          max_tokens: 100,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs API error:", errorText)
      let errorMessage = "Failed to get agent response"

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // If we can't parse the error, just use the text
      }

      throw new Error(errorMessage)
    }

    // Get agent response
    const agentResponse = await response.json()
    const agentMessage = agentResponse.output.text
    console.log("Received agent response:", agentMessage)

    // Add agent response to conversation history
    const updatedHistory = [...conversationState.history]
    updatedHistory.push({
      role: "assistant",
      content: agentMessage,
      timestamp: new Date().toISOString(),
    })

    // Update conversation history in database
    const supabase = getServerClient()
    await supabase
      .from("conversations")
      .update({
        history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationState.id)

    console.log("Updated conversation with agent response, new history length:", updatedHistory.length)

    // Return agent response and conversation ID
    return NextResponse.json({
      message: agentMessage,
      conversationId: conversationState.id,
      audio: agentResponse.output.audio_url || null,
    })
  } catch (error: any) {
    console.error("Error with ElevenLabs agent:", error)
    return NextResponse.json({ error: error.message || "Failed to process agent request" }, { status: 500 })
  }
}
