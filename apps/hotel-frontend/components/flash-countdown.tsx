"use client"

import { useEffect, useState } from "react"

function getRemaining() {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0) // countdown to midnight
  const diff = Math.max(0, end.getTime() - now.getTime())
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return { h, m, s }
}

export function FlashCountdown() {
  const [time, setTime] = useState<{ h: number; m: number; s: number } | null>(
    null,
  )

  useEffect(() => {
    setTime(getRemaining())
    const id = setInterval(() => setTime(getRemaining()), 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const cells = time
    ? [
        { v: pad(time.h), l: "시간" },
        { v: pad(time.m), l: "분" },
        { v: pad(time.s), l: "초" },
      ]
    : [
        { v: "--", l: "시간" },
        { v: "--", l: "분" },
        { v: "--", l: "초" },
      ]

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-primary-foreground/80">
        마감까지
      </span>
      <div className="flex items-center gap-2">
        {cells.map((c, i) => (
          <div key={c.l} className="flex items-center gap-2">
            <div className="flex flex-col items-center rounded-xl bg-background/15 px-3 py-2 backdrop-blur">
              <span className="font-heading text-2xl font-extrabold tabular-nums">
                {c.v}
              </span>
              <span className="text-[10px] font-medium text-primary-foreground/70">
                {c.l}
              </span>
            </div>
            {i < cells.length - 1 && (
              <span className="text-xl font-bold text-primary-foreground/60">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
