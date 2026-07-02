import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Star, Check, Flame } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingPanel } from "@/components/booking-panel"
import { getHotel } from "@/lib/hotels"

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const hotel = getHotel(id)
  
  if (!hotel) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            돌아가기
          </Link>

          <div className="mt-4 grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-3 sm:grid-rows-2 sm:h-96 relative">
            <div className="relative sm:col-span-2 sm:row-span-2 aspect-[16/10] sm:aspect-auto">
              <Image
                src={hotel.gallery[0] || hotel.image}
                alt={`${hotel.name} 대표 사진`}
                fill
                priority
                className="object-cover"
              />
              {/* 플래시 세일 배지 */}
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-primary-foreground shadow-md animate-pulse">
                <Flame className="size-3.5" /> FLASH SALE · 한정 수량
              </span>
            </div>
            {hotel.gallery.slice(1, 3).map((src, i) => (
              <div key={i} className="relative aspect-[16/10] sm:aspect-auto">
                <Image
                  src={src || "/placeholder.svg"}
                  alt={`${hotel.name} 사진 ${i + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {hotel.city} · {hotel.area}
              </div>
              <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance">
                [타임특가] {hotel.name}
              </h1>
              <p className="text-sm text-muted-foreground">{hotel.nameEn}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-sm font-bold">
                  <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                  {hotel.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  후기 {hotel.reviews.toLocaleString("ko-KR")}개
                </span>
              </div>

              <p className="mt-6 leading-relaxed text-foreground/90">
                {hotel.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {hotel.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <hr className="my-8 border-border" />

              <h2 className="font-heading text-xl font-extrabold">편의시설</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {hotel.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-primary">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="lg:sticky lg:top-20">
                {/* 특가 전용 Props 주입 */}
                <BookingPanel 
                  hotel={hotel} 
                  isEvent={true} 
                  eventPrice={hotel.price} 
                  eventCheckIn="2026-07-15"
                  eventCheckOut="2026-07-16"
                  eventGuests={2}
                  eventNights={1}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}