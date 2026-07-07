"use client"

import { useEffect, useState } from "react"

// 딜은 매일 오전 10시에 오픈해서 12시간 뒤인 오후 10시에 마감됨
const OPEN_HOUR = 10
const OPEN_DURATION_HOURS = 12

function getRemaining() {
  const now = new Date()

  const todayOpen = new Date(now)
  todayOpen.setHours(OPEN_HOUR, 0, 0, 0)
  const todayClose = new Date(todayOpen)
  todayClose.setHours(todayOpen.getHours() + OPEN_DURATION_HOURS)

  // 오픈 시간(10시~22시) 안이면 마감까지 남은 시간을, 그 밖(22시~다음날 10시)이면
  // 다음 오픈까지 남은 시간을 보여줌 — 이 시간대엔 딜이 진행 중이 아니기 때문
  const isOpen = now >= todayOpen && now < todayClose
  let target: Date
  if (isOpen) {
    target = todayClose
  } else if (now < todayOpen) {
    target = todayOpen
  } else {
    target = new Date(todayOpen)
    target.setDate(target.getDate() + 1)
  }

  const diff = Math.max(0, target.getTime() - now.getTime())
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return { h, m, s, isOpen }
}

export function FlashCountdown() {
  const [time, setTime] = useState<{
    h: number
    m: number
    s: number
    isOpen: boolean
  } | null>(null)

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
        {time && !time.isOpen ? "오픈까지" : "마감까지"}
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
