"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { CalendarDays, Users, ShieldCheck, Flame } from "lucide-react"
import { type Hotel, formatKRW } from "@/lib/hotels"
import { track } from "@/lib/telemetry"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// 특가 모드를 위한 props 인터페이스
interface BookingPanelProps {
  hotel: Hotel
  isEvent?: boolean       // 특가 이벤트 여부
  eventPrice?: number     // 고정 특가 요금
  eventCheckIn?: string   // 고정 체크인 날짜
  eventCheckOut?: string  // 고정 체크아웃 날짜
  eventGuests?: number    // 고정 인원
  eventNights?: number    // 고정 박수
}

export function BookingPanel({ 
  hotel,
  isEvent = false,
  eventPrice,
  eventCheckIn = "2026-07-15",
  eventCheckOut = "2026-07-16",
  eventGuests = 2,
  eventNights = 1,
}: BookingPanelProps) {
  const router = useRouter()
  const { user } = useAuth()

  // isEvent 상태에 따라 초기값을 분기합니다.
  const [checkIn, setCheckIn] = useState(isEvent ? eventCheckIn : todayISO(3))
  const [checkOut, setCheckOut] = useState(isEvent ? eventCheckOut : todayISO(5))
  const [guests, setGuests] = useState(isEvent ? eventGuests : 2)
  const [isReserving, setIsReserving] = useState(false)
  const [reserveError, setReserveError] = useState("")

  // 1. 숙박 일수 계산
  const nights = useMemo(() => {
    if (isEvent) return eventNights
    const a = new Date(checkIn).getTime()
    const b = new Date(checkOut).getTime()
    const n = Math.round((b - a) / 86_400_000)
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [checkIn, checkOut, isEvent, eventNights])

  // 2. 인원별 가산점 및 총 룸 가격 계산
  const roomTotal = useMemo(() => {
    if (isEvent && eventPrice) return eventPrice 
    
    const basePricePerNight = hotel.price
    const extraGuestFeePerNight = guests > 2 ? (guests - 2) * 20000 : 0
    return (basePricePerNight + extraGuestFeePerNight) * nights
  }, [hotel.price, guests, nights, isEvent, eventPrice])

  // 3. 서비스 수수료 (10%) 및 최종 금액 계산
  const serviceFee = isEvent ? 0 : Math.round(roomTotal * 0.1) // 특가는 수수료가 포함된 최종 가격으로 가정
  const total = roomTotal + serviceFee

  async function reserve() {
    track({
      name: isEvent ? "event.purchase_clicked" : "booking.reserve_clicked",
      attributes: {
        hotelId: hotel.id,
        nights,
        guests,
        total,
      },
    })

    if (!user) {
      router.push("/login")
      return
    }

    const finalCheckIn = isEvent ? eventCheckIn : checkIn
    const finalCheckOut = isEvent ? eventCheckOut : checkOut
    const finalGuests = isEvent ? eventGuests : guests
    const roomType = isEvent ? (hotel.tags[0] ?? "특가 객실") : "스탠다드 (기본)"

    setReserveError("")
    setIsReserving(true)
    try {
      const booking = await apiFetch("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify({
          hotelId: hotel.id,
          hotelName: hotel.name,
          roomType,
          checkIn: finalCheckIn,
          checkOut: finalCheckOut,
          nights,
          guests: finalGuests,
          totalPrice: total,
        }),
      })

      const params = new URLSearchParams({
        hotel: hotel.id,
        in: finalCheckIn,
        out: finalCheckOut,
        guests: String(finalGuests),
        nights: String(nights),
        total: String(total),
        bookingId: booking.id,
      })
      router.push(`/booking/confirmation?${params.toString()}`)
    } catch (err: any) {
      setReserveError(err.message || "예약에 실패했습니다.")
    } finally {
      setIsReserving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-baseline gap-2">
        {/* 특가 상품일 때 움직이는 'Flash' 뱃지 노출 */}
        {isEvent && (
          <span className="inline-flex items-center gap-0.5 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase animate-pulse">
            <Flame className="size-3" /> Flash
          </span>
        )}
        {hotel.originalPrice && (
          <span className="text-sm text-muted-foreground line-through">
            {formatKRW(hotel.originalPrice)}
          </span>
        )}
        <span className="font-heading text-2xl font-extrabold">
          {formatKRW(isEvent && eventPrice ? eventPrice : hotel.price)}
        </span>
        <span className="text-sm text-muted-foreground">
          {isEvent ? "/ 총 요금" : "/ 박 (2인 기준)"}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {/* 특가 모드일 때는 disabled 속성으로 인풋 창을 비활성화하고 배경 톤 낮춤 */}
        <div className={`grid grid-cols-2 overflow-hidden rounded-xl border border-border ${isEvent ? "bg-secondary/40" : ""}`}>
          <label className="flex flex-col gap-0.5 border-r border-border p-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" /> 체크인
            </span>
            <input
              type="date"
              value={isEvent ? eventCheckIn : checkIn}
              disabled={isEvent}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none disabled:text-foreground/70"
            />
          </label>
          <label className="flex flex-col gap-0.5 p-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" /> 체크아웃
            </span>
            <input
              type="date"
              value={isEvent ? eventCheckOut : checkOut}
              disabled={isEvent}
              onChange={(e) => setCheckOut(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none disabled:text-foreground/70"
            />
          </label>
        </div>
        <label className={`flex flex-col gap-0.5 rounded-xl border border-border p-3 ${isEvent ? "bg-secondary/40" : ""}`}>
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
            <Users className="size-3" aria-hidden="true" /> 인원
          </span>
          <select
            value={isEvent ? eventGuests : guests}
            disabled={isEvent}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="bg-transparent text-sm font-medium outline-none disabled:text-foreground/70 disabled:appearance-none"
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
        disabled={isReserving}
        className={`mt-4 w-full rounded-xl py-3.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 ${isEvent ? "bg-destructive text-white" : "bg-primary"}`}
      >
        {isReserving ? "처리 중..." : isEvent ? "선착순 특가 결제하기" : "예약하기"}
      </button>
      {reserveError && (
        <p className="mt-2 text-center text-xs font-medium text-destructive">{reserveError}</p>
      )}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {isEvent ? "선착순 한정 상품으로 빠른 결제가 필요합니다" : "지금 예약해도 요금이 청구되지 않아요"}
      </p>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>
            {isEvent ? "플래시 딜 특가 적용 요금" : `기본 요금 및 인원 추가 금액 (${nights}박)`}
          </span>
          <span>{formatKRW(roomTotal)}</span>
        </div>
        {!isEvent && (
          <div className="flex justify-between text-muted-foreground">
            <span>서비스 수수료 (10%)</span>
            <span>{formatKRW(serviceFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 font-heading font-extrabold">
          <span>총 결제금액</span>
          <span>{formatKRW(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{isEvent ? "본 특가 상품은 취소 및 변경이 불가합니다." : "체크인 하루 전까지 무료 취소 가능합니다."}</span>
      </div>
    </div>
  )
}