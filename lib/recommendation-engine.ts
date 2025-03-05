import type { CurrencyPair } from "@/types/currency"
import type { EconomicEvent } from "@/types/economic-event"

type Recommendation = {
  action: string
  confidence: number
  reason: string
}

export function generateRecommendation(currencyPair: CurrencyPair, economicEvents: EconomicEvent[]): Recommendation {
  // Extract the currencies from the pair (e.g., "EUR/USD" -> ["EUR", "USD"])
  const currencies = currencyPair.n.split("/")

  if (currencies.length !== 2) {
    return {
      action: "Wait",
      confidence: 0,
      reason: "Invalid currency pair format",
    }
  }

  const baseCurrency = currencies[0]
  const quoteCurrency = currencies[1]

  // Filter events related to either currency in the pair
  const relevantEvents = economicEvents.filter(
    (event) => event.currency === baseCurrency || event.currency === quoteCurrency,
  )

  // If no relevant events, return a "Wait" recommendation
  if (relevantEvents.length === 0) {
    return {
      action: "Wait",
      confidence: 30,
      reason: "No relevant economic events found for this currency pair",
    }
  }

  // Sort events by impact (highest impact first)
  const sortedEvents = [...relevantEvents].sort((a, b) => Number.parseInt(b.impact, 10) - Number.parseInt(a.impact, 10))

  // Get the most impactful event
  const mostImpactfulEvent = sortedEvents[0]

  // Calculate a score for the base currency and quote currency
  let baseScore = 0
  let quoteScore = 0

  for (const event of sortedEvents) {
    const impact = Number.parseInt(event.impact, 10) || 0
    const isPositive = isEventPositive(event)
    const score = impact * (isPositive ? 1 : -1)

    if (event.currency === baseCurrency) {
      baseScore += score
    } else if (event.currency === quoteCurrency) {
      quoteScore += score
    }
  }

  // Calculate the overall score (positive favors base currency, negative favors quote currency)
  const overallScore = baseScore - quoteScore

  // Determine the recommendation based on the overall score
  let action: string
  let confidence: number
  let reason: string

  const absScore = Math.abs(overallScore)
  confidence = Math.min(Math.floor(absScore * 10), 95) // Scale confidence, cap at 95%

  if (absScore < 2) {
    action = "Hold"
    confidence = Math.max(confidence, 40)
    reason = `Neutral outlook based on ${sortedEvents.length} economic indicators`
  } else if (overallScore > 0) {
    action = "Buy"
    reason = `Positive outlook for ${baseCurrency} based on ${mostImpactfulEvent.title}`
  } else {
    action = "Sell"
    reason = `Positive outlook for ${quoteCurrency} based on ${mostImpactfulEvent.title}`
  }

  return {
    action,
    confidence,
    reason,
  }
}

function isEventPositive(event: EconomicEvent): boolean {
  // If there's no actual value, we can't determine if it's positive
  if (!event.actual || !event.forecast) {
    return false
  }

  // Convert to numbers for comparison
  const actual = Number.parseFloat(event.actual_norm)
  const forecast = Number.parseFloat(event.forecast_norm)
  const previous = Number.parseFloat(event.previous_norm)

  // Check if the values are valid numbers
  if (isNaN(actual) || isNaN(forecast)) {
    return false
  }

  // For most economic indicators, higher than forecast is positive
  // This is a simplified approach - in reality, the interpretation depends on the specific indicator
  const betterThanForecast = actual > forecast

  // For some indicators like unemployment rate, lower is better
  // This would need to be expanded with a more comprehensive list of indicators
  const isLowerBetter =
    event.title.toLowerCase().includes("unemployment") || event.title.toLowerCase().includes("inflation")

  return isLowerBetter ? actual < forecast : betterThanForecast
}

