import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// Hardcoded base URL to ensure consistency
const BASE_URL = "https://talkto.brad.llc"

export default function DebugPage() {
  // This is a server component, so we can access environment variables directly
  const envVars = {
    VERCEL_URL: process.env.VERCEL_URL || "Not set",
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "Not set",
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? "Set" : "Not set",
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID
      ? "Set (first 4 chars: " + process.env.TWILIO_ACCOUNT_SID.substring(0, 4) + "...)"
      : "Not set",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
      ? "Set (length: " + process.env.TWILIO_AUTH_TOKEN.length + ")"
      : "Not set",
  }

  const testUrls = {
    twiml: `${BASE_URL}/api/twiml?messageId=test&voice=alloy`,
    callStatus: `${BASE_URL}/api/call-status?messageId=test`,
    testTwilio: `${BASE_URL}/api/test-twilio`,
  }

  // Check if VERCEL_URL matches our hardcoded URL
  const vercelUrlMatches =
    process.env.VERCEL_URL === BASE_URL || process.env.VERCEL_URL === BASE_URL.replace("https://", "")

  // Check if NEXT_PUBLIC_VERCEL_URL matches our hardcoded URL
  const nextPublicVercelUrlMatches =
    process.env.NEXT_PUBLIC_VERCEL_URL === BASE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL === BASE_URL.replace("https://", "")

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Debug Information</h1>
        <p className="text-muted-foreground mt-2">This page shows information about your environment configuration</p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Important: Hardcoded URL in Use</AlertTitle>
        <AlertDescription>
          This application is using a hardcoded URL (<span className="font-mono">{BASE_URL}</span>) for all Twilio
          webhooks, regardless of the environment variables shown below. This ensures consistent webhook URLs across
          deployments.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Actual URLs Used for Webhooks</CardTitle>
          <CardDescription>These are the exact URLs being used for Twilio webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2 bg-green-50 p-2 rounded">
              <span className="font-medium">Hardcoded Base URL</span>
              <span className="font-mono font-bold">{BASE_URL}</span>
            </div>

            {Object.entries(testUrls).map(([key, url]) => (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="font-medium">{key}</span>
                <span className="font-mono text-sm break-all">{url}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            These environment variables are shown for reference only and are not used for webhook URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div
                key={key}
                className={`flex justify-between border-b pb-2 ${
                  (key === "VERCEL_URL" && !vercelUrlMatches) ||
                  (key === "NEXT_PUBLIC_VERCEL_URL" && !nextPublicVercelUrlMatches)
                    ? "bg-yellow-50"
                    : ""
                }`}
              >
                <span className="font-medium">{key}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>

          {(!vercelUrlMatches || !nextPublicVercelUrlMatches) && (
            <div className="mt-4 text-sm text-yellow-600">
              <p>
                <strong>Note:</strong> The environment variables above don't match the hardcoded URL, but this won't
                affect functionality since we're using the hardcoded URL directly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How URLs Are Generated</CardTitle>
          <CardDescription>Explanation of how webhook URLs are created</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This application uses a hardcoded base URL (<span className="font-mono">{BASE_URL}</span>) for all Twilio
            webhooks. This approach ensures that:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>Webhook URLs are consistent across all deployments</li>
            <li>URLs don't change even if environment variables are updated</li>
            <li>The custom domain is always used instead of Vercel deployment URLs</li>
          </ul>

          <p className="text-sm text-muted-foreground">
            The hardcoded URL is defined in <span className="font-mono">lib/url-utils.ts</span>,
            <span className="font-mono">app/actions/make-call.ts</span>, and other relevant files.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
