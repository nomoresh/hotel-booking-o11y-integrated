"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Activity, Globe } from "lucide-react"
import { User, Flame, LogOut } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { clearStoredUser, useAuth } from "@/lib/auth"

export function SiteHeader() {
  const router = useRouter()
  const { user } = useAuth()
  const isLoggedIn = Boolean(user)

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/users/logout", { method: "POST" })
    } finally {
      clearStoredUser()
      router.push("/")
    }
  }

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
          <Link
            href={isLoggedIn ? "/mypage" : "/login"}
            aria-label="마이페이지"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <User className="size-5" /> 
          </Link>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <LogOut className="size-3.5" /> {user!.name}님 로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
