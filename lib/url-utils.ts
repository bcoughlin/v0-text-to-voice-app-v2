/**
 * Gets the base URL for the application, handling various environment configurations
 * @returns The base URL with protocol (e.g., https://example.vercel.app)
 */
export function getBaseUrl(): string {
  // For debugging
  console.log("Environment variables for URL generation:")
  console.log("VERCEL_URL:", process.env.VERCEL_URL)
  console.log("NEXT_PUBLIC_VERCEL_URL:", process.env.NEXT_PUBLIC_VERCEL_URL)

  // HARDCODED OVERRIDE - Use this as the primary URL
  // This ensures we always use the custom domain regardless of other settings
  const customDomain = "https://talkto.brad.llc"
  console.log("Using hardcoded custom domain:", customDomain)
  return customDomain

  // The code below is commented out as we're using the hardcoded override above
  /*
  // Check for manually set full URL in VERCEL_URL
  if (
    process.env.VERCEL_URL &&
    (process.env.VERCEL_URL.startsWith("http://") || process.env.VERCEL_URL.startsWith("https://"))
  ) {
    const url = process.env.VERCEL_URL.endsWith("/") ? process.env.VERCEL_URL.slice(0, -1) : process.env.VERCEL_URL
    console.log("Using full VERCEL_URL:", url)
    return url
  }

  // Check for domain-only VERCEL_URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`
    console.log("Using domain-only VERCEL_URL:", url)
    return url
  }

  // Check for NEXT_PUBLIC_VERCEL_URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    // Handle if it already has protocol
    if (process.env.NEXT_PUBLIC_VERCEL_URL.startsWith("http")) {
      const url = process.env.NEXT_PUBLIC_VERCEL_URL.endsWith("/")
        ? process.env.NEXT_PUBLIC_VERCEL_URL.slice(0, -1)
        : process.env.NEXT_PUBLIC_VERCEL_URL
      console.log("Using full NEXT_PUBLIC_VERCEL_URL:", url)
      return url
    }

    // Handle domain-only
    const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    console.log("Using domain-only NEXT_PUBLIC_VERCEL_URL:", url)
    return url
  }

  // Fallback for local development
  console.log("Using localhost fallback")
  return "http://localhost:3000"
  */
}

/**
 * Creates a webhook URL for Twilio
 * @param path The path for the webhook (e.g., /api/twiml)
 * @param params Query parameters to include
 * @returns The full webhook URL
 */
export function createWebhookUrl(path: string, params: Record<string, string> = {}): string {
  const baseUrl = getBaseUrl()

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  // Build query string
  const queryString =
    Object.keys(params).length > 0
      ? "?" +
        Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join("&")
      : ""

  const fullUrl = `${baseUrl}${normalizedPath}${queryString}`
  console.log(`Created webhook URL: ${fullUrl}`)
  return fullUrl
}
