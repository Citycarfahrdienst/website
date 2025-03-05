"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/dashboard-header"
import CurrencyPairsTable from "@/components/currency-pairs-table"
import EconomicEventsCalendar from "@/components/economic-events-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrencyPairs } from "@/hooks/use-currency-pairs"
import { useEconomicEvents } from "@/hooks/use-economic-events"
import { analyzeEvent } from "@/lib/event-analyzer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Home() {
  const { currencyPairs, error: currencyError } = useCurrencyPairs()
  const { events, error: eventsError } = useEconomicEvents()
  const [stats, setStats] = useState({
    activePairs: 0,
    buySignals: 0,
    sellSignals: 0,
  })
  const [latestSignals, setLatestSignals] = useState<any[]>([])
  const [aiError, setAiError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const updateDebugInfo = useCallback(() => {
    let info = ""
    if (currencyError) info += `Currency Pairs Error: ${currencyError?.message}\n\n`
    if (eventsError) info += `Economic Events Error: ${eventsError?.message}\n\n`
    if (aiError) info += `AI Analysis Error: ${aiError}\n\n`
    setDebugInfo(info)
  }, [currencyError, eventsError, aiError])

  useEffect(() => {
    updateDebugInfo()
  }, [updateDebugInfo])

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setAiError(null)
    try {
      const signalPromises = events.map((event) => analyzeEvent(event))
      const signals = (await Promise.all(signalPromises)).filter((signal) => signal !== null)

      setLatestSignals(signals)

      const buyCount = signals.filter((signal) => signal.signal.toLowerCase() === "buy").length
      const sellCount = signals.filter((signal) => signal.signal.toLowerCase() === "sell").length

      setStats((prevStats) => ({
        ...prevStats,
        buySignals: buyCount,
        sellSignals: sellCount,
      }))
    } catch (error) {
      console.error("Error during AI analysis:", error)
      setAiError("An error occurred during AI analysis. Please try again later.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [events])

  useEffect(() => {
    setStats((prevStats) => ({
      ...prevStats,
      activePairs: currencyPairs.length,
    }))
  }, [currencyPairs])

  useEffect(() => {
    if (events.length > 0) {
      runAnalysis()
    }
  }, [events, runAnalysis])

  // Background update every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        if (events.length > 0) {
          runAnalysis()
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(intervalId)
  }, [events, runAnalysis])

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="grid gap-6">
          {(currencyError || eventsError || aiError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>An error occurred. Check the debug menu for details.</AlertDescription>
            </Alert>
          )}
          {isAnalyzing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Updating</AlertTitle>
              <AlertDescription>Refreshing AI analysis in the background...</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Debug Information</DialogTitle>
                  <DialogDescription>Here's the current debug information for the application.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <pre className="bg-secondary p-4 rounded-md overflow-auto max-h-[300px]">
                    {debugInfo || "No errors to report."}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="calendar">Economic Calendar</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Pairs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activePairs}</div>
                    <p className="text-xs text-muted-foreground">Major and minor currency pairs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Buy Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{stats.buySignals}</div>
                    <p className="text-xs text-muted-foreground">Based on today's economic events</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sell Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats.sellSignals}</div>
                    <p className="text-xs text-muted-foreground">Based on today's economic events</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Latest AI-Generated Signals</CardTitle>
                  <CardDescription>Based on today's economic events and AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestSignals.length > 0 ? (
                    <ul className="space-y-2">
                      {latestSignals.map((signal, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span>
                            {signal.event}: {signal.signal} {signal.direction}
                          </span>
                          <span className="text-sm text-muted-foreground">{signal.confidence} confidence</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No signals available for today's events.</p>
                  )}
                </CardContent>
              </Card>
              <CurrencyPairsTable />
            </TabsContent>
            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Calendar</CardTitle>
                  <CardDescription>
                    Upcoming and recent economic events that may impact currency markets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EconomicEventsCalendar />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

