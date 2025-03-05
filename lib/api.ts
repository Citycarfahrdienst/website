import type { CurrencyPair } from "@/types/currency"
import type { EconomicEvent } from "@/types/economic-event"

const CURRENCY_API_URL =
  "https://iswfx.dukascopy.com/index.php?_action=quotes_list_2&udid=fab75a5df0964a0b845527d1edaddfbf&check=247e4e8b75f77fe301012a05e984b366&version=5.12&os=18.3.1&model=iPhoneiPhone14,3"
const ECONOMIC_EVENTS_API_URL = "https://freeserv.dukascopy.com/2.0/index.php?path=economic_calendar/getNews"

export async function fetchCurrencyPairs(): Promise<CurrencyPair[]> {
  try {
    const response = await fetch("/api/currency-pairs")

    if (!response.ok) {
      throw new Error(`Failed to fetch currency pairs: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching currency pairs:", error)
    throw error
  }
}

export async function fetchEconomicEvents(since: number, until: number): Promise<EconomicEvent[]> {
  try {
    const response = await fetch(`/api/economic-events?since=${since}&until=${until}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch economic events: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching economic events:", error)
    throw error
  }
}

