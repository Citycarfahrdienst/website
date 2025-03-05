"use client"

import { useState, useEffect, useRef } from "react"
import { fetchCurrencyPairs } from "@/lib/api"
import type { CurrencyPair } from "@/types/currency"

export function useCurrencyPairs() {
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const previousPairsRef = useRef<CurrencyPair[]>([])

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout

    const loadCurrencyPairs = async () => {
      try {
        if (isLoading || !lastUpdated || Date.now() - lastUpdated >= 1000) {
          const data = await fetchCurrencyPairs()

          if (isMounted) {
            // Only update if there are actual changes to avoid unnecessary re-renders
            const hasChanges =
              !previousPairsRef.current.length ||
              data.some((pair, index) => {
                const prevPair = previousPairsRef.current[index]
                return !prevPair || prevPair.bid !== pair.bid || prevPair.ask !== pair.ask
              })

            if (hasChanges) {
              setCurrencyPairs(data)
              previousPairsRef.current = data
            }

            setLastUpdated(Date.now())
            setError(null)
            setIsLoading(false)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch currency pairs"))
          console.error("Error fetching currency pairs:", err)
          setIsLoading(false)
        }
      }
    }

    // Initial load
    loadCurrencyPairs()

    // Set up interval to refresh data every second
    intervalId = setInterval(loadCurrencyPairs, 1000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [isLoading, lastUpdated])

  return { currencyPairs, isLoading, error, lastUpdated }
}

