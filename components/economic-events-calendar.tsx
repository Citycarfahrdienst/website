"use client"

import { useEffect, useState, useCallback } from "react"
import { format, parseISO, isAfter } from "date-fns"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEconomicEvents } from "@/hooks/use-economic-events"
import type { EconomicEvent } from "@/types/economic-event"
import { analyzeEvent } from "@/lib/event-analyzer"

export default function EconomicEventsCalendar() {
  const { events, isLoading, error, refreshEvent } = useEconomicEvents()
  const [sortedEvents, setSortedEvents] = useState<EconomicEvent[]>([])
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({})

  useEffect(() => {
    if (events.length > 0) {
      const sorted = [...events].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      setSortedEvents(sorted)
    }
  }, [events])

  const analyzeAndRefreshEvent = useCallback(
    async (event: EconomicEvent) => {
      const result = await analyzeEvent(event)
      setAnalysisResults((prev) => ({ ...prev, [event.id]: result }))
      refreshEvent(event.id)
    },
    [refreshEvent],
  )

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date()
      sortedEvents.forEach((event) => {
        const eventTime = parseISO(event.date)
        if (isAfter(now, eventTime) && !event.actual) {
          analyzeAndRefreshEvent(event)
        }
      })
    }, 60000) // Check every minute

    return () => clearInterval(intervalId)
  }, [sortedEvents, analyzeAndRefreshEvent])

  const getImpactBadge = (impact: string) => {
    const impactLevel = Number.parseInt(impact, 10)
    if (impactLevel >= 3) {
      return <Badge variant="destructive">High</Badge>
    } else if (impactLevel === 2) {
      return <Badge variant="default">Medium</Badge>
    } else {
      return <Badge variant="outline">Low</Badge>
    }
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM dd, yyyy HH:mm")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Safely extract text from HTML
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html")
    return doc.body.textContent || ""
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time (Berlin)</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Actual</TableHead>
            <TableHead>Forecast</TableHead>
            <TableHead>Previous</TableHead>
            <TableHead>Analysis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading economic events...
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-red-500">
                Error loading economic events. Using fallback data.
              </TableCell>
            </TableRow>
          ) : sortedEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No economic events available for the selected date range
              </TableCell>
            </TableRow>
          ) : (
            sortedEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{formatEventDate(event.date)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.currency}</span>
                    <span className="text-xs text-muted-foreground">{event.country}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                    {stripHtml(event.description.substring(0, 100) + "...")}
                  </div>
                </TableCell>
                <TableCell>{getImpactBadge(event.impact)}</TableCell>
                <TableCell className="font-medium">{event.actual || "-"}</TableCell>
                <TableCell>{event.forecast || "-"}</TableCell>
                <TableCell>{event.previous || "-"}</TableCell>
                <TableCell>
                  {analysisResults[event.id] ? (
                    <div>
                      <Badge className={getSignalColor(analysisResults[event.id].signal)}>
                        {analysisResults[event.id].signal} {analysisResults[event.id].direction}
                      </Badge>
                      <div className="text-xs mt-1">Confidence: {analysisResults[event.id].confidence}</div>
                      <div className="text-xs mt-1">{analysisResults[event.id].reasoning}</div>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function getSignalColor(signal: string) {
  switch (signal.toLowerCase()) {
    case "buy":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    case "sell":
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
    case "neutral":
      return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
    case "wait":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
  }
}

