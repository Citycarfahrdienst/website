"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchEconomicEvents } from "@/lib/api"
import type { EconomicEvent } from "@/types/economic-event"

export function useEconomicEvents() {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  })

  const updateDateRange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to })
    setIsLoading(true)
  }, [])

  const refreshEvent = useCallback(
    async (eventId: string) => {
      try {
        const updatedEvent = await fetchEconomicEvents(dateRange.from.getTime(), dateRange.to.getTime(), eventId)
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event.id === eventId ? { ...event, ...updatedEvent[0] } : event)),
        )
      } catch (err) {
        console.error("Error refreshing event:", err)
      }
    },
    [dateRange],
  )

  useEffect(() => {
    let isMounted = true

    const loadEconomicEvents = async () => {
      try {
        setIsLoading(true)
        const since = dateRange.from.getTime()
        const until = dateRange.to.getTime()

        const data = await fetchEconomicEvents(since, until)

        if (isMounted) {
          setEvents(data)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch economic events"))
          console.error("Error fetching economic events:", err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadEconomicEvents()

    return () => {
      isMounted = false
    }
  }, [dateRange])

  return { events, isLoading, error, updateDateRange, refreshEvent }
}

