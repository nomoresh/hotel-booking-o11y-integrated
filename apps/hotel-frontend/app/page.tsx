import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, ShieldCheck, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SearchBar } from "@/components/search-bar"
import { HotelCard } from "@/components/hotel-card"
import { HOTELS } from "@/lib/hotels"

const regions = [
  { name: "제주", en: "Jeju", href: "/search?q=제주" },
  { name: "서울", en: "Seoul", href: "/search?q=서울" },
  { name: "부산", en: "Busan", href: "/search?q=부산" },
  { name: "강원", en: "Gangwon", href: "/search?q=강원" },
  { name: "전주", en: "Jeonju", href: "/search?q=전주" },
  { name: "인천", en: "Incheon", href: "/search?q=인천" },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-resort.png"
              alt="해변 리조트 전경"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-24 sm:pt-32">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold text-background backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden="true" />
              오늘의 특가 · Flash Deals
            </span>
            <h1 className="mt-4 max-w-2xl font-heading text-4xl font-extrabold leading-tight text-background text-balance sm:text-5xl break-keep">
              완벽한 여행은{" "}
              <span className="text-accent whitespace-nowrap">완벽한 숙소</span>에서 시작돼요
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-background/80">
              Find your perfect stay.<br />
              실시간 특가부터 프리미엄 리조트까지, 지금 바로 검색하세요.
            </p>
          </div>
          <div className="relative mx-auto -mb-16 max-w-5xl px-4">
            <SearchBar />
          </div>
        </section>

        {/* Trust bar */}
        <section className="mx-auto mt-24 max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, t: "최저가 보장", d: "더 싼 곳을 찾으면 차액을 돌려드려요" },
              { icon: Clock, t: "무료 취소", d: "체크인 하루 전까지 100% 무료 취소" },
              { icon: Sparkles, t: "실시간 특가", d: "매일 갱신되는 한정 수량 플래시 딜" },
            ].map((f) => (
              <div
                key={f.t}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-heading text-sm font-bold">{f.t}</div>
                  <p className="text-sm text-muted-foreground">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Regions */}
        <section id="regions" className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="font-heading text-2xl font-extrabold">지역별 인기 여행지</h2>
          <p className="mt-1 text-sm text-muted-foreground">Popular destinations</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {regions.map((r) => (
              <Link
                key={r.name}
                href={r.href}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {r.name}{" "}
                <span className="text-muted-foreground">{r.en}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Event banner */}
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <Link
            href="/events"
            className="group flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/20 px-3 py-1 text-xs font-bold">
                <Sparkles className="size-3.5" aria-hidden="true" />
                LIMITED
              </span>
              <h2 className="mt-3 font-heading text-2xl font-extrabold text-balance">
                타임세일 특가 이벤트 · 최대 45% 할인
              </h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                한정 수량 · 매일 오전 10시 오픈. 지금 놓치면 아쉬운 딜을 만나보세요.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 font-semibold text-foreground transition-transform group-hover:translate-x-1">
              이벤트 보러가기
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </section>

        {/* Featured hotels */}
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-extrabold">
                지금 뜨는 숙소
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Trending stays this week
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              전체보기 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {HOTELS.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>

        <div className="h-16" />
      </main>
      <SiteFooter />
    </div>
  )
}
