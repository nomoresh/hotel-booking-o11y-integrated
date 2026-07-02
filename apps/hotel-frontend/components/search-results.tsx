"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { HotelCard } from "@/components/hotel-card"
import { HOTELS } from "@/lib/hotels"
import { track } from "@/lib/telemetry"

type SortKey = "recommended" | "price-asc" | "price-desc" | "rating"

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "추천순" },
  { key: "price-asc", label: "낮은 가격순" },
  { key: "price-desc", label: "높은 가격순" },
  { key: "rating", label: "평점순" },
]

export function SearchResults() {
  const params = useSearchParams()
  const q = params.get("q")?.trim() ?? ""
  const guests = params.get("guests") ?? "2"
  const [sort, setSort] = useState<SortKey>("recommended")

  const results = useMemo(() => {
    let list = HOTELS.filter((h) => {
      if (!q) return true
      const hay = `${h.name} ${h.nameEn} ${h.city} ${h.area} ${h.tags.join(" ")}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
    list = [...list]
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price)
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price)
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating)
    return list
  }, [q, sort])

  useEffect(() => {
    track({
      name: "search.results_viewed",
      attributes: { query: q || "any", guests, count: results.length, sort },
    })
  }, [q, guests, results.length, sort])

  return (
    <>
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SearchBar compact />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold">
              {q ? `"${q}" 검색 결과` : "전체 숙소"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              게스트 {guests}명 · 총 {results.length}개의 숙소
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="flex flex-wrap gap-1">
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setSort(o.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    sort === o.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-heading text-lg font-bold">검색 결과가 없어요</p>
            <p className="mt-1 text-sm text-muted-foreground">
              다른 여행지나 조건으로 다시 검색해 보세요.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
