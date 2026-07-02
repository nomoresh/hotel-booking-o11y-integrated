import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Flame, MapPin, Users } from "lucide-react"
import { type ResolvedDeal, formatKRW } from "@/lib/hotels"

export function EventDealCard({ deal }: { deal: ResolvedDeal }) {
  const { hotel, checkIn, checkOut } = deal
  const discount = hotel.originalPrice
    ? Math.round((1 - hotel.price / hotel.originalPrice) * 100)
    : 0
  const soldRatio = 1 - deal.deal.remaining / deal.deal.stock
  const low = deal.deal.remaining <= 3 && !deal.soldOut

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      
      <Link href={deal.soldOut ? "#" : `/events/${hotel.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={hotel.image || "/placeholder.svg"}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-primary-foreground">
              <Flame className="size-3.5" aria-hidden="true" />
              {discount}% OFF
            </span>
          )}
          {deal.soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
              <span className="rounded-full bg-background px-4 py-1.5 text-sm font-bold text-foreground">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 pb-0"> 
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {hotel.city} · {hotel.area}
          </div>
          <h3 className="mt-1 font-heading text-base font-bold leading-snug">
            {hotel.name}
          </h3>
          <p className="text-xs text-muted-foreground">{deal.deal.roomType}</p>

          {/* Fixed options */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {checkIn} ~ {checkOut} ({deal.deal.nights}박)
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {deal.deal.guests}인
            </span>
          </div>

          {/* Stock */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className={low ? "font-bold text-destructive" : "font-medium text-muted-foreground"}>
                {deal.soldOut ? "매진되었습니다" : `잔여 ${deal.deal.remaining}개 · 선착순`}
              </span>
              <span className="text-muted-foreground">{deal.deal.stock}개 한정</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${low ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(100, Math.round(soldRatio * 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
            <div className="flex flex-col">
              {hotel.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatKRW(hotel.originalPrice)}
                </span>
              )}
              <span className="font-heading text-lg font-extrabold">
                {formatKRW(hotel.price)}
                <span className="text-xs font-medium text-muted-foreground"> / 박</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        {deal.soldOut ? (
          <span className="mt-3 block w-full rounded-xl bg-secondary py-2.5 text-center text-sm font-semibold text-muted-foreground">
            매진
          </span>
        ) : (
          <Link
            href={`/booking/confirmation?hotel=${hotel.id}&in=${checkIn}&out=${checkOut}&guests=${deal.deal.guests}&nights=${deal.deal.nights}&total=${hotel.price}`}
            className="mt-3 block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            즉시 결제하기
          </Link>
        )}
      </div>

    </div>
  )
}