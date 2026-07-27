"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Users, Hourglass, ShieldAlert } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface WaitingRoomProps {
  isOpen: boolean
  dealId: string
  onSuccess: (admissionToken: string) => void
}

interface QueueStatusResponse {
  state: "WAITING" | "ADMITTED" | "NOT_IN_QUEUE"
  position: number | null
  totalWaiting: number | null
  estimatedSeconds: number | null
  admissionToken: string | null
}

const POLL_INTERVAL_MS = 1500

export function WaitingRoom({ isOpen, dealId, onSuccess }: WaitingRoomProps) {
  const [status, setStatus] = useState<QueueStatusResponse | null>(null)
  const [displaySeconds, setDisplaySeconds] = useState<number | null>(null)
  const hasFinishedRef = useRef(false)

  // 실제 대기열 진입 + 주기적 상태 폴링 (더 이상 Math.random() 연출이 아니라 진짜 서버 상태)
  useEffect(() => {
    if (!isOpen) {
      hasFinishedRef.current = false
      setStatus(null)
      setDisplaySeconds(null)
      return
    }

    let cancelled = false

    apiFetch<QueueStatusResponse>(`/api/v1/queue/${dealId}/join`, { method: "POST" })
      .then((data) => {
        if (!cancelled && data) setStatus(data)
      })
      .catch(() => {
        // 대기열 API 실패 시에도 화면 자체는 유지 (폴링에서 재시도됨)
      })

    const timer = setInterval(() => {
      apiFetch<QueueStatusResponse>(`/api/v1/queue/${dealId}/status`)
        .then((data) => {
          if (!cancelled && data) setStatus(data)
        })
        .catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isOpen, dealId])

  // 서버는 폴링 주기(1.5초)마다 "현재 순번 기준 예상 시간"을 다시 계산해서 내려줄 뿐,
  // 1초 단위로 줄어드는 카운트다운이 아니다 — 그대로 쓰면 순번이 안 바뀌는 동안 숫자가
  // 멈춰있는 것처럼 보인다. 새로 내려온 값으로 로컬 카운트다운을 재동기화(resync)만 하고,
  // 실제로 눈에 보이는 매초 감소는 아래 타이머가 화면에서만 담당한다.
  useEffect(() => {
    if (status?.estimatedSeconds != null) {
      setDisplaySeconds(status.estimatedSeconds)
    }
  }, [status?.estimatedSeconds])

  useEffect(() => {
    if (!isOpen) return
    const tick = setInterval(() => {
      setDisplaySeconds((prev) => (prev != null && prev > 0 ? prev - 1 : prev))
    }, 1000)
    return () => clearInterval(tick)
  }, [isOpen])

  // 승격(ADMITTED) 감지: onSuccess는 여기서 정확히 한 번만 호출
  // 발급받은 admissionToken을 그대로 넘겨서, 예약 API 호출 시 "대기열을 통과했다"는 증거로 쓰게 한다.
  useEffect(() => {
    if (isOpen && status?.state === "ADMITTED" && status.admissionToken && !hasFinishedRef.current) {
      hasFinishedRef.current = true
      onSuccess(status.admissionToken)
    }
  }, [isOpen, status, onSuccess])

  if (!isOpen) return null

  const waitingCount = status?.totalWaiting ?? 0
  const estimatedSeconds = displaySeconds ?? status?.estimatedSeconds ?? 0

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