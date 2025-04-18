import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Message } from "@/types"

interface DashboardProps {
  messages: Message[]
}

export function Dashboard({ messages }: DashboardProps) {
  // Calculate statistics
  const totalCalls = messages.length
  const completedCalls = messages.filter((m) => m.status === "completed").length
  const failedCalls = messages.filter((m) => m.status === "failed").length
  const inProgressCalls = messages.filter((m) => m.status === "in-progress" || m.status === "pending").length

  const completionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0

  return (
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
  )
}
