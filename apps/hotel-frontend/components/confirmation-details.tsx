"use client"

import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { BellRing, CalendarDays, CheckCircle2, MapPin, Users } from "lucide-react"
import { getHotel, formatKRW } from "@/lib/hotels"
import { track } from "@/lib/telemetry"

export function ConfirmationDetails() {
  const params = useSearchParams()
  const hotel = getHotel(params.get("hotel") ?? "")
  const checkIn = params.get("in") ?? ""
  const checkOut = params.get("out") ?? ""
  const guests = params.get("guests") ?? "2"
  const nights = params.get("nights") ?? "1"
  const total = Number(params.get("total") ?? "0")

  const bookingId = useMemo(
    () => "STAY-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    [],
  )

  useEffect(() => {
    if (hotel) {
      track({
        name: "booking.confirmed",
        attributes: { hotelId: hotel.id, bookingId, nights, guests, total },
      })
    }
  }, [hotel, bookingId, nights, guests, total])

  if (!hotel) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-heading text-lg font-bold">예약 정보를 찾을 수 없어요</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          홈으로 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-9" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold">
          예약이 확정되었어요!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your booking is confirmed · 예약번호 {bookingId}
        </p>
      </div>

      {/* Notification banner */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <BellRing className="size-4" aria-hidden="true" />
        </span>
        <p className="text-sm text-foreground/90">
          확인 알림과 바우처를 이메일과 앱 푸시로 보내드렸어요. 체크인 하루 전
          리마인더 알림도 예약되었습니다.
        </p>
      </div>

      {/* Summary card */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex gap-4 p-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={hotel.image || "/placeholder.svg"}
              alt={hotel.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              {hotel.city} · {hotel.area}
            </div>
            <h2 className="mt-1 font-heading text-lg font-bold leading-snug">
              {hotel.name}
            </h2>
            <p className="text-sm text-muted-foreground">{hotel.nameEn}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border">
          <Detail
            icon={<CalendarDays className="size-4" />}
            label="체크인"
            value={checkIn || "-"}
          />
          <Detail
            icon={<CalendarDays className="size-4" />}
            label="체크아웃"
            value={checkOut || "-"}
          />
          <Detail
            icon={<Users className="size-4" />}
            label="인원"
            value={`게스트 ${guests}명`}
          />
          <Detail
            icon={<CalendarDays className="size-4" />}
            label="숙박"
            value={`${nights}박`}
          />
        </dl>

        <div className="flex items-center justify-between p-4">
          <span className="font-heading font-extrabold">총 결제금액</span>
          <span className="font-heading text-xl font-extrabold text-primary">
            {formatKRW(total)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/search"
          className="flex-1 rounded-xl border border-border bg-card py-3 text-center text-sm font-semibold transition-colors hover:bg-secondary"
        >
          다른 숙소 더 보기
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-card p-4">
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
        <span className="text-primary" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}
