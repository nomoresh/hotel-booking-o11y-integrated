import Link from "next/link"
import Image from "next/image"
import { MapPin, Star } from "lucide-react"
import { type Hotel, formatKRW } from "@/lib/hotels"

const badgeStyles: Record<string, string> = {
  특가: "bg-accent text-accent-foreground",
  인기: "bg-primary text-primary-foreground",
  신규: "bg-foreground text-background",
}

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const discount = hotel.originalPrice
    ? Math.round((1 - hotel.price / hotel.originalPrice) * 100)
    : 0

  return (
    <Link
      href={`/hotels/${hotel.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={hotel.image || "/placeholder.svg"}
          alt={`${hotel.name} 사진`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hotel.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${badgeStyles[hotel.badge]}`}
          >
            {hotel.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {hotel.city} · {hotel.area}
        </div>
        <h3 className="font-heading text-base font-bold leading-snug text-balance">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1.5 text-sm">
          <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
          <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({hotel.reviews.toLocaleString("ko-KR")})
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-wrap gap-1">
            {hotel.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-right">
            {hotel.originalPrice && (
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-accent">{discount}%</span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatKRW(hotel.originalPrice)}
                </span>
              </div>
            )}
            <div className="font-heading text-lg font-extrabold">
              {formatKRW(hotel.price)}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                / 박
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
