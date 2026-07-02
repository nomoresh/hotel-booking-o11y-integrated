"use client"

import { useEffect, useState } from "react"
import { Loader2, Users, Hourglass, ShieldAlert } from "lucide-react"

interface WaitingRoomProps {
  isOpen: boolean
  onSuccess: () => void
}

export function WaitingRoom({ isOpen, onSuccess }: WaitingRoomProps) {
  const [waitingCount, setWaitingCount] = useState(1753)
  const [estimatedSeconds, setEstimatedSeconds] = useState(12)

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setWaitingCount((prev) => {
        const nextCount = Math.max(0, prev - Math.floor(Math.random() * 150) - 50)
        
        if (nextCount <= 50) {
          clearInterval(timer)
          setTimeout(() => {
            onSuccess()
          }, 0)
          return 0
        }
    
        return nextCount
      })

      setEstimatedSeconds((prev) => (prev > 1 ? prev - 1 : 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onSuccess])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center size-20 rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-10 animate-spin" />
            <Hourglass className="size-5 absolute animate-pulse text-primary/80" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-extrabold tracking-tight">
            접속 대기 안내
          </h2>
          <p className="text-sm text-muted-foreground">
            현재 순간적인 대규모 트래픽으로 인해 접속자가 몰리고 있습니다. <br />
            잠시만 기다려주시면 자동으로 연결됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-secondary/50 rounded-xl p-4 border border-border">
          <div className="flex flex-col items-center justify-center border-r border-border/60 py-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase mb-1">
              <Users className="size-3.5 text-primary" /> 대기 인원
            </span>
            <span className="font-heading text-lg font-black text-foreground">
              {waitingCount.toLocaleString()}명
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase mb-1">
              <Hourglass className="size-3.5 text-primary" /> 예상 시간
            </span>
            <span className="font-heading text-lg font-black text-primary animate-pulse">
              약 {estimatedSeconds}초
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/10 p-3 text-left text-xs text-destructive">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <span>
            새로고침을 하거나 창을 닫으면 대기 순번이 초기화되어 대기 시간이 더 길어질 수 있으니 주의해 주세요.
          </span>
        </div>

      </div>
    </div>
  )
}