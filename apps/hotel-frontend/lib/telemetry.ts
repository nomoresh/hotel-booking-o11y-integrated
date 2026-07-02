"use client"

/**
 * Lightweight client-side telemetry hook.
 * "o11y integrated" — this is the single seam where booking-funnel events are
 * emitted. Wire this to your real observability backend (OpenTelemetry, Datadog,
 * Sentry, etc.) later; for now it logs structured spans to the console.
 */

export type TelemetryEvent = {
  name: string
  attributes?: Record<string, string | number | boolean | undefined>
}

export function track({ name, attributes = {} }: TelemetryEvent) {
  const payload = {
    ts: new Date().toISOString(),
    service: "hotel-reserve",
    event: name,
    ...attributes,
  }
  // Structured, greppable log line for the observability pipeline.
  console.log("[v0][o11y]", JSON.stringify(payload))
}
