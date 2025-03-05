"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { ArrowDown, ArrowUp, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCurrencyPairs } from "@/hooks/use-currency-pairs"
import { useEconomicEvents } from "@/hooks/use-economic-events"
import { generateRecommendation } from "@/lib/recommendation-engine"
import type { CurrencyPair } from "@/types/currency"

// Memoized table row to prevent unnecessary re-renders
const CurrencyPairRow = memo(
  ({
    pair,
    recommendation,
  }: {
    pair: CurrencyPair
    recommendation: { action: string; confidence: number; reason: string }
  }) => {
    const spread = (Number.parseFloat(pair.ask) - Number.parseFloat(pair.bid)).toFixed(5)

    const getRecommendationColor = (action: string) => {
      switch (action.toLowerCase()) {
        case "buy":
          return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
        case "sell":
          return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
        case "hold":
          return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
        case "wait":
          return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
        default:
          return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
      }
    }

    const getConfidenceLabel = (confidence: number) => {
      if (confidence >= 80) return "High"
      if (confidence >= 50) return "Medium"
      return "Low"
    }

    return (
      <TableRow key={pair.id}>
        <TableCell className="font-medium">{pair.n}</TableCell>
        <TableCell>{pair.bid}</TableCell>
        <TableCell>{pair.ask}</TableCell>
        <TableCell>{spread}</TableCell>
        <TableCell>
          <Badge className={getRecommendationColor(recommendation.action)}>
            {recommendation.action === "Buy" && <ArrowUp className="h-3 w-3 mr-1" />}
            {recommendation.action === "Sell" && <ArrowDown className="h-3 w-3 mr-1" />}
            {recommendation.action}
          </Badge>
        </TableCell>
        <TableCell>{getConfidenceLabel(recommendation.confidence)}</TableCell>
        <TableCell className="max-w-xs truncate" title={recommendation.reason}>
          {recommendation.reason}
        </TableCell>
      </TableRow>
    )
  },
)

CurrencyPairRow.displayName = "CurrencyPairRow"

export default function CurrencyPairsTable() {
  const { currencyPairs, isLoading, lastUpdated } = useCurrencyPairs()
  const { events } = useEconomicEvents()
  const [recommendations, setRecommendations] = useState<
    Record<string, { action: string; confidence: number; reason: string }>
  >({})
  const [buyCount, setBuyCount] = useState(0)
  const [sellCount, setSellCount] = useState(0)

  // Memoized function to generate recommendations
  const generateRecommendations = useCallback(() => {
    if (currencyPairs.length > 0 && events.length > 0) {
      const newRecommendations: Record<string, { action: string; confidence: number; reason: string }> = {}
      let buyCount = 0
      let sellCount = 0

      currencyPairs.forEach((pair) => {
        const recommendation = generateRecommendation(pair, events)
        newRecommendations[pair.id] = recommendation

        if (recommendation.action === "Buy") buyCount++
        if (recommendation.action === "Sell") sellCount++
      })

      setRecommendations(newRecommendations)
      setBuyCount(buyCount)
      setSellCount(sellCount)
    }
  }, [currencyPairs, events])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4">
        <div className="font-medium">Currency Pairs</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Never"}</span>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Bid</TableHead>
            <TableHead>Ask</TableHead>
            <TableHead>Spread</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading currency pairs...
                </div>
              </TableCell>
            </TableRow>
          ) : currencyPairs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No currency pairs available
              </TableCell>
            </TableRow>
          ) : (
            currencyPairs.map((pair) => {
              const recommendation = recommendations[pair.id] || {
                action: "Wait",
                confidence: 0,
                reason: "Analyzing data...",
              }
              return <CurrencyPairRow key={pair.id} pair={pair} recommendation={recommendation} />
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

