import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SearchResults } from "@/components/search-results"

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">
              검색 중...
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
