import { Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { EventDealCard } from "@/components/event-deal-card"
import { FlashCountdown } from "@/components/flash-countdown"
import { getEventDeals } from "@/lib/hotels"

export default function EventsPage() {
  const deals = getEventDeals()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/20 px-3 py-1 text-xs font-bold">
              <Sparkles className="size-3.5" aria-hidden="true" />
              FLASH SALE · 한정 수량
            </span>
            <h1 className="mt-4 font-heading text-3xl font-extrabold text-balance sm:text-4xl">
              타임세일 특가 이벤트
            </h1>
            <p className="mt-2 max-w-xl text-primary-foreground/80">
              매일 오전 10시 오픈되는 한정 딜. 최대 45% 할인된 가격으로 프리미엄
              숙소를 예약하세요.
            </p>
            <div className="mt-6">
              <FlashCountdown />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="font-heading text-xl font-extrabold">
            오늘의 플래시 딜
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s flash deals · {deals.length}개 진행 중 · 선착순 구매
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <EventDealCard key={deal.hotel.id} deal={deal} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
