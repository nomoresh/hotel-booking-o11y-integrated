"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound, Mail, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 추후 백엔드 Auth API(JWT) 연동 영역
    console.log("로그인 시도:", { email, password })
    
    // 임시로 로그인 성공 처리 후 메인이나 특가 페이지로 이동
    router.push("/search")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl space-y-6">
          
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-2xl font-black tracking-tight">돌아오신 것을 환영합니다</h1>
            <p className="text-sm text-muted-foreground">선착순 특가 타임세일을 놓치지 마세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Mail className="size-3.5 text-primary" /> 이메일 주소
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <KeyRound className="size-3.5 text-primary" /> 비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              로그인하기 <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              회원가입
            </Link>
          </div>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}