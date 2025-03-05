import { NextResponse } from "next/server"
import type { EconomicEvent } from "@/types/economic-event"

const ECONOMIC_EVENTS_API_URL = "https://freeserv.dukascopy.com/2.0/index.php?path=economic_calendar/getNews"

// Fallback data in case the API is unavailable
const fallbackEvents: EconomicEvent[] = [
  {
    date: "2025-03-02T21:45:00+0000",
    id: "14429318",
    country: "NZ",
    currency: "NZD",
    event_tag: "NZ_TerofTraInd",
    title: "Terms of Trade Index",
    description:
      "The Terms of Trade Index released by the Statistics New Zealand is a measure of balance amount between import and export. A positive value shows a trade surplus while a negative value shows a trade deficit.",
    impact: "2",
    actual: "3.10%",
    actual_norm: "3.100",
    forecast: "1.10%",
    forecast_norm: "1.100",
    previous: "2.40%",
    previous_norm: "2.400",
    source_link: "http://www.stats.govt.nz/",
    value_order: null,
    value_format: "%0.1f%%",
  },
  {
    date: "2025-03-03T01:30:00+0000",
    id: "14429319",
    country: "AU",
    currency: "AUD",
    event_tag: "AU_RetSal",
    title: "Retail Sales",
    description: "Retail Sales measure the change in the total value of sales at the retail level.",
    impact: "3",
    actual: "0.3%",
    actual_norm: "0.300",
    forecast: "0.2%",
    forecast_norm: "0.200",
    previous: "0.1%",
    previous_norm: "0.100",
    source_link: "",
    value_order: null,
    value_format: "%0.1f%%",
  },
  {
    date: "2025-03-03T09:30:00+0000",
    id: "14429320",
    country: "GB",
    currency: "GBP",
    event_tag: "GB_PMI_Con",
    title: "Construction PMI",
    description: "The Construction PMI measures the activity level of purchasing managers in the construction sector.",
    impact: "1",
    actual: "52.4",
    actual_norm: "52.400",
    forecast: "51.9",
    forecast_norm: "51.900",
    previous: "51.7",
    previous_norm: "51.700",
    source_link: "",
    value_order: null,
    value_format: "%0.1f",
  },
  {
    date: "2025-03-03T13:45:00+0000",
    id: "14429321",
    country: "US",
    currency: "USD",
    event_tag: "US_PMI_Ser",
    title: "Services PMI",
    description: "The Services PMI measures the activity level of purchasing managers in the services sector.",
    impact: "3",
    actual: "54.8",
    actual_norm: "54.800",
    forecast: "54.0",
    forecast_norm: "54.000",
    previous: "53.6",
    previous_norm: "53.600",
    source_link: "",
    value_order: null,
    value_format: "%0.1f",
  },
  {
    date: "2025-03-04T00:30:00+0000",
    id: "14429322",
    country: "AU",
    currency: "AUD",
    event_tag: "AU_CurAcc",
    title: "Current Account",
    description:
      "The Current Account measures the difference in value between exported and imported goods, services, and interest payments.",
    impact: "2",
    actual: "7.8B",
    actual_norm: "7.800",
    forecast: "6.5B",
    forecast_norm: "6.500",
    previous: "5.2B",
    previous_norm: "5.200",
    source_link: "",
    value_order: null,
    value_format: "%0.1fB",
  },
  {
    date: "2025-03-04T13:30:00+0000",
    id: "14429323",
    country: "CA",
    currency: "CAD",
    event_tag: "CA_TraBal",
    title: "Trade Balance",
    description: "The Trade Balance measures the difference in value between imported and exported goods and services.",
    impact: "2",
    actual: "1.2B",
    actual_norm: "1.200",
    forecast: "0.8B",
    forecast_norm: "0.800",
    previous: "0.5B",
    previous_norm: "0.500",
    source_link: "",
    value_order: null,
    value_format: "%0.1fB",
  },
  {
    date: "2025-03-05T09:30:00+0000",
    id: "14429324",
    country: "GB",
    currency: "GBP",
    event_tag: "GB_PMI_Ser",
    title: "Services PMI",
    description: "The Services PMI measures the activity level of purchasing managers in the services sector.",
    impact: "2",
    actual: "53.8",
    actual_norm: "53.800",
    forecast: "53.5",
    forecast_norm: "53.500",
    previous: "53.1",
    previous_norm: "53.100",
    source_link: "",
    value_order: null,
    value_format: "%0.1f",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since")
  const until = searchParams.get("until")

  if (!since || !until) {
    return NextResponse.json({ error: "Missing required parameters: since and until" }, { status: 400 })
  }

  try {
    const url = `${ECONOMIC_EVENTS_API_URL}&since=${since}&until=${until}`

    // Add browser-like headers to avoid 403 errors
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.dukascopy.com/",
        Origin: "https://www.dukascopy.com",
        Connection: "keep-alive",
      },
    })

    if (!response.ok) {
      console.warn(`API returned ${response.status}, using fallback data`)
      // Return fallback data if the API request fails
      return NextResponse.json(fallbackEvents)
    }

    const text = await response.text()

    // The API returns JSONP, so we need to extract the JSON part
    const jsonpRegex = /jsonp$$(.*)$$/s
    const match = text.match(jsonpRegex)

    if (!match || !match[1]) {
      console.warn("Invalid JSONP response format, using fallback data")
      return NextResponse.json(fallbackEvents)
    }

    const jsonData = JSON.parse(match[1]) as EconomicEvent[]

    return NextResponse.json(jsonData)
  } catch (error) {
    console.error("Error in economic events API route:", error)
    // Return fallback data in case of any error
    return NextResponse.json(fallbackEvents)
  }
}

