import Link from "next/link"
import { Activity, Globe } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-extrabold tracking-tight">
            StayScope
          </span>
          <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
            nomoresh
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/search" className="transition-colors hover:text-foreground">
            숙소 검색
          </Link>
          <Link href="/events" className="transition-colors hover:text-foreground">
            특가 이벤트
          </Link>
          <Link href="/#regions" className="transition-colors hover:text-foreground">
            지역별
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Globe className="size-4" aria-hidden="true" />
            KR / EN
          </button>
          <button
            type="button"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            로그인
          </button>
        </div>
      </div>
    </header>
  )
}
