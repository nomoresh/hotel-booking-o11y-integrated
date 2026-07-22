"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { HotelCard } from "@/components/hotel-card"
import { getHotel, type Hotel } from "@/lib/hotels"
import { apiFetch } from "@/lib/api"
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
  const [results, setResults] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const fetchResults = async () => {
      setIsLoading(true)
      setError("")
      try {
        const query = new URLSearchParams({ sort })
        if (q) query.set("keyword", q)

        // search-service는 id/city/area/basePrice/rating만 내려주므로,
        // 이미지·태그 등 화면에 필요한 나머지 정보는 정적 데이터에서 id로 매칭해 채움
        const matched =
          (await apiFetch<{ id: string }[]>(
            `/api/v1/hotels?${query.toString()}`
          )) ?? []
        if (cancelled) return
        const hotels = matched
          .map((h) => getHotel(h.id))
          .filter((h): h is Hotel => Boolean(h))
        setResults(hotels)
      } catch (err: any) {
        if (!cancelled) setError("검색 결과를 불러오는 데 실패했습니다.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchResults()
    return () => {
      cancelled = true
    }
  }, [q, sort])

  useEffect(() => {
    if (isLoading) return
    track({
      name: "search.results_viewed",
      attributes: { query: q || "any", guests, count: results.length, sort },
    })
  }, [q, guests, results.length, sort, isLoading])

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

        {isLoading ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">검색 중...</div>
        ) : error ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-heading text-lg font-bold text-destructive">{error}</p>
          </div>
        ) : results.length > 0 ? (
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
