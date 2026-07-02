"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { User, Calendar, CreditCard, ShoppingBag, CheckCircle2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { formatKRW } from "@/lib/hotels"

// 더미 예매 데이터 (추후 booking-service API와 연동)
const mockBookings = [
  {
    id: "B-2026-0702-01",
    type: "deal", // 'deal' = 선착순 특가, 'regular' = 일반 예약
    hotelName: "신라호텔 서울",
    roomType: "디럭스 더블룸 (특가)",
    image: "/placeholder.svg",
    checkIn: "2026-07-15",
    checkOut: "2026-07-17",
    nights: 2,
    guests: 2,
    totalPrice: 240000,
    status: "CONFIRMED", // CONFIRMED, CANCELED
    createdAt: "2026-07-02",
  },
  {
    id: "B-2026-0615-04",
    type: "regular",
    hotelName: "그랜드 하얏트 제주",
    roomType: "킹 베드 뷰 룸",
    image: "/placeholder.svg",
    checkIn: "2026-08-01",
    checkOut: "2026-08-02",
    nights: 1,
    guests: 2,
    totalPrice: 380000,
    status: "CONFIRMED",
    createdAt: "2026-06-15",
  },
]

export default function MyPage() {
  // 가상 유저 상태 정보
  const [user] = useState({
    name: "홍길동",
    email: "nomoresh@example.com",
    level: "VIP",
  })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1 bg-secondary/20 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-black text-foreground">{user.name} 님</h2>
                  <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                    {user.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3 border-t border-border pt-4 sm:border-none sm:pt-0">
              <div className="text-center sm:text-right">
                <p className="text-xs text-muted-foreground">총 예약 건수</p>
                <p className="font-heading text-lg font-bold text-foreground">{mockBookings.length}건</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex gap-4 text-sm font-semibold">
                <h3 className="text-base font-bold text-foreground">전체 예약 내역</h3>
              </div>
            </div>

            <div className="space-y-4">
              {mockBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                  <ShoppingBag className="mx-auto size-10 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">조건에 맞는 예약 내역이 없습니다.</p>
                </div>
              ) : (
                mockBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full md:w-48 shrink-0 overflow-hidden bg-secondary">
                      <Image
                        src={booking.image}
                        alt={booking.hotelName}
                        fill
                        className="object-cover"
                      />
                      {booking.type === "deal" && (
                        <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-black text-primary-foreground uppercase animate-pulse">
                          타임세일
                        </span>
                      )}
                    </div>

                    {/* 예약 세부 정보 */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-muted-foreground">
                            주문번호 {booking.id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" /> 예약 확정
                          </span>
                        </div>

                        <h3 className="font-heading text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                          {booking.hotelName}
                        </h3>
                        <p className="text-xs text-muted-foreground">{booking.roomType}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" /> {booking.checkIn} ~ {booking.checkOut} ({booking.nights}박)
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="size-3.5" /> 성인 {booking.guests}인
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 md:mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CreditCard className="size-3.5" /> 결제금액
                        </div>
                        <span className="font-heading text-base font-extrabold text-foreground">
                          {formatKRW(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}