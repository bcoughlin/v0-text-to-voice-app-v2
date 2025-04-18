import { Suspense } from "react"
import { getMessages, getVoiceSettings } from "./actions"
import { MessageForm } from "@/components/message-form"
import { MessageHistory } from "@/components/message-history"
import { VoiceTest } from "@/components/voice-test"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TextToVoicePage() {
  const messages = await getMessages()
  const voiceSettings = await getVoiceSettings()

  // Calculate statistics
  const totalCalls = messages.length
  const completedCalls = messages.filter((m) => m.status === "completed").length
  const failedCalls = messages.filter((m) => m.status === "failed").length
  const inProgressCalls = messages.filter((m) => m.status === "in-progress" || m.status === "pending").length
  const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Text to Voice Call</h1>
        <p className="text-muted-foreground mt-2">Convert text to speech and call any phone number</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Send a Voice Message</CardTitle>
            <CardDescription>Enter your message and the recipient's phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading form...</div>}>
              <MessageForm voiceSettings={voiceSettings} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Voice</CardTitle>
            <CardDescription>Test how your message will sound without making a call</CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceTest voiceSettings={voiceSettings} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCalls}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedCalls}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{failedCalls}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>View all your previous voice messages</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageHistory messages={messages} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
