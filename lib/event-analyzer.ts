import type { EconomicEvent } from "@/types/economic-event"

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDs1WquHLOg1F6NVR02caXXAqw9a6HnDjI'

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set. AI analysis will not be available.")
}

const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent?key=${API_KEY}`

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === maxRetries || error.status !== 429) {
        throw error
      }
      const delayTime = baseDelay * Math.pow(2, attempt - 1)
      console.warn(`Attempt ${attempt} failed. Retrying in ${delayTime}ms...`)
      await delay(delayTime)
    }
  }
  throw new Error("Max retries reached")
}

export async function analyzeEvent(event: EconomicEvent): Promise<any> {
  const currentDate = new Date().toISOString().split("T")[0]
  if (!event.date.startsWith(currentDate)) {
    return null // Skip events not from today
  }

  const prompt = `
Analyze the following economic event for today (${currentDate}) and generate a clear trading signal:

Event: ${event.title}
Currency: ${event.currency}
Previous: ${event.previous}
Forecast: ${event.forecast}
Actual: ${event.actual || "N/A"}

Provide a trading signal in the following format:
Event: [Event Title]
Signal: [BUY/SELL/NEUTRAL/WAIT]
Confidence: [percentage between 60-95%]
Reasoning: [1-2 sentence explanation]
Direction: [↑ for buy, ↓ for sell, ↔ for neutral]
Affected markets: [List of potentially affected markets, e.g., "EUR/USD, DAX, Gold"]
`

  try {
    const result = await retryWithBackoff(async () => {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    })

    const lines = result.split("\n")
    const parsedSignal: any = {}
    lines.forEach((line) => {
      const [key, value] = line.split(":").map((s) => s.trim())
      if (key && value) {
        parsedSignal[key.toLowerCase()] = value
      }
    })

    return parsedSignal
  } catch (error) {
    console.error("Error analyzing event:", error)
    return null
  }
}

