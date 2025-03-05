import { NextResponse } from "next/server"
import type { CurrencyPair } from "@/types/currency"

const CURRENCY_API_URL =
  "https://iswfx.dukascopy.com/index.php?_action=quotes_list_2&udid=fab75a5df0964a0b845527d1edaddfbf&check=247e4e8b75f77fe301012a05e984b366&version=5.12&os=18.3.1&model=iPhoneiPhone14,3"

// Fallback data in case the API is unavailable
const fallbackPairs: CurrencyPair[] = [
  {
    id: 1020,
    n: "EUR/USD",
    def: 1,
    group: "majors",
    bid: "1.07834",
    ask: "1.07841",
    descr: "Euro vs US Dollar",
    delay: 0,
  },
  {
    id: 1032,
    n: "USD/JPY",
    def: 1,
    group: "majors",
    bid: "148.672",
    ask: "148.681",
    descr: "US Dollar vs Yen",
    delay: 0,
  },
  {
    id: 1026,
    n: "GBP/USD",
    def: 1,
    group: "majors",
    bid: "1.28702",
    ask: "1.28711",
    descr: "Pound Sterling vs US Dollar",
    delay: 0,
  },
  {
    id: 1022,
    n: "USD/CHF",
    def: 1,
    group: "majors",
    bid: "0.89721",
    ask: "0.89731",
    descr: "US Dollar vs Swiss Franc",
    delay: 0,
  },
  {
    id: 1028,
    n: "AUD/USD",
    def: 1,
    group: "majors",
    bid: "0.65432",
    ask: "0.65442",
    descr: "Australian Dollar vs US Dollar",
    delay: 0,
  },
  {
    id: 1030,
    n: "USD/CAD",
    def: 1,
    group: "majors",
    bid: "1.35621",
    ask: "1.35631",
    descr: "US Dollar vs Canadian Dollar",
    delay: 0,
  },
  {
    id: 1034,
    n: "NZD/USD",
    def: 1,
    group: "majors",
    bid: "0.60123",
    ask: "0.60133",
    descr: "New Zealand Dollar vs US Dollar",
    delay: 0,
  },
]

export async function GET() {
  try {
    const response = await fetch(CURRENCY_API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.dukascopy.com/",
        Origin: "https://www.dukascopy.com",
        Connection: "keep-alive",
      },
      next: { revalidate: 1 },
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Too Many Requests, using fallback data")
        return NextResponse.json(fallbackPairs)
      }
      throw new Error(`API returned ${response.status}`)
    }

    const text = await response.text()

    // Check if the response starts with "Too Many Requests"
    if (text.startsWith("Too Many Requests")) {
      console.warn("Too Many Requests, using fallback data")
      return NextResponse.json(fallbackPairs)
    }

    let data: CurrencyPair[]
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError)
      console.warn("Invalid JSON response, using fallback data")
      return NextResponse.json(fallbackPairs)
    }

    const filteredPairs = data.filter((pair) => pair.group === "majors" || pair.group === "minors")

    return NextResponse.json(filteredPairs)
  } catch (error) {
    console.error("Error in currency pairs API route:", error)
    return NextResponse.json(fallbackPairs)
  }
}

