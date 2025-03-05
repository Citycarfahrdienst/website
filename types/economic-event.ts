export interface EconomicEvent {
  date: string
  id: string
  country: string
  currency: string
  event_tag: string
  title: string
  description: string
  impact: string
  actual: string
  actual_norm: string
  forecast: string
  forecast_norm: string
  previous: string
  previous_norm: string
  source_link: string
  value_order: string | null
  value_format: string
}

