"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarDays, MapPin, Search, Users } from "lucide-react"
import { track } from "@/lib/telemetry"

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [destination, setDestination] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(2)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    track({
      name: "search.submitted",
      attributes: { destination: destination || "any", checkIn, checkOut, guests },
    })
    const params = new URLSearchParams()
    if (destination) params.set("q", destination)
    if (checkIn) params.set("in", checkIn)
    if (checkOut) params.set("out", checkOut)
    params.set("guests", String(guests))
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-primary/5 sm:grid-cols-2 ${
        compact ? "lg:grid-cols-[1.4fr_1fr_1fr_auto]" : "lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto]"
      }`}
    >
      <Field icon={<MapPin className="size-4" />} label="여행지 / Destination">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="도시, 지역, 호텔명"
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
        />
      </Field>
      <Field icon={<CalendarDays className="size-4" />} label="체크인">
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm font-medium outline-none"
        />
      </Field>
      <Field icon={<CalendarDays className="size-4" />} label="체크아웃">
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm font-medium outline-none"
        />
      </Field>
      {!compact && (
        <Field icon={<Users className="size-4" />} label="인원">
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-medium outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                게스트 {n}명
              </option>
            ))}
          </select>
        </Field>
      )}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Search className="size-4" aria-hidden="true" />
        검색
      </button>
    </form>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-secondary/60">
      <span className="text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {children}
      </span>
    </label>
  )
}
