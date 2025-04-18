"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestTwiMLPage() {
  const [messageId, setMessageId] = useState("test")
  const [voice, setVoice] = useState("alloy")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const testTwiML = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/twiml?messageId=${messageId}&voice=${voice}`)
      const text = await res.text()
      setResponse(text)
    } catch (error) {
      setResponse(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Test TwiML Endpoint</h1>
        <p className="text-muted-foreground mt-2">This page tests if the TwiML endpoint is working correctly</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TwiML Test</CardTitle>
          <CardDescription>Enter a message ID and voice to test the TwiML endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Message ID</label>
            <Input value={messageId} onChange={(e) => setMessageId(e.target.value)} placeholder="Enter message ID" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Voice</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-2 border rounded">
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>

          <Button onClick={testTwiML} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test TwiML Endpoint"}
          </Button>

          {response && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Response:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">{response}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
