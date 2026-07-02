"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { CalendarDays, Users, ShieldCheck } from "lucide-react"
import { type Hotel, formatKRW } from "@/lib/hotels"
import { track } from "@/lib/telemetry"

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function BookingPanel({ hotel }: { hotel: Hotel }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(todayISO(3))
  const [checkOut, setCheckOut] = useState(todayISO(5))
  const [guests, setGuests] = useState(2)

  const nights = useMemo(() => {
    const a = new Date(checkIn).getTime()
    const b = new Date(checkOut).getTime()
    const n = Math.round((b - a) / 86_400_000)
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [checkIn, checkOut])

  const roomTotal = hotel.price * nights
  const serviceFee = Math.round(roomTotal * 0.1)
  const total = roomTotal + serviceFee

  function reserve() {
    track({
      name: "booking.reserve_clicked",
      attributes: {
        hotelId: hotel.id,
        nights,
        guests,
        total,
      },
    })
    const params = new URLSearchParams({
      hotel: hotel.id,
      in: checkIn,
      out: checkOut,
      guests: String(guests),
      nights: String(nights),
      total: String(total),
    })
    router.push(`/booking/confirmation?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-baseline gap-2">
        {hotel.originalPrice && (
          <span className="text-sm text-muted-foreground line-through">
            {formatKRW(hotel.originalPrice)}
          </span>
        )}
        <span className="font-heading text-2xl font-extrabold">
          {formatKRW(hotel.price)}
        </span>
        <span className="text-sm text-muted-foreground">/ 박</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border">
          <label className="flex flex-col gap-0.5 border-r border-border p-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" /> 체크인
            </span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none"
            />
          </label>
          <label className="flex flex-col gap-0.5 p-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" /> 체크아웃
            </span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-0.5 rounded-xl border border-border p-3">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
            <Users className="size-3" aria-hidden="true" /> 인원
          </span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="bg-transparent text-sm font-medium outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                게스트 {n}명
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={reserve}
        className="mt-4 w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        예약하기
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        지금 예약해도 요금이 청구되지 않아요
      </p>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>
            {formatKRW(hotel.price)} × {nights}박
          </span>
          <span>{formatKRW(roomTotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>서비스 수수료</span>
          <span>{formatKRW(serviceFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-heading font-extrabold">
          <span>총 결제금액</span>
          <span>{formatKRW(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        체크인 하루 전까지 무료 취소 가능합니다.
      </div>
    </div>
  )
}
