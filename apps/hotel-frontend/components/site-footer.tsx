import { Activity } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" aria-hidden="true" />
            </span>
            <span className="font-heading text-base font-extrabold">StayScope</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            트렌디한 여행을 위한 호텔 예약 플랫폼.
            <br />
            Observability integrated service.
          </p>
        </div>
        {[
          { h: "서비스", items: ["숙소 검색", "특가 이벤트", "지역별 추천", "멤버십"] },
          { h: "고객지원", items: ["자주 묻는 질문", "예약 확인", "취소·환불", "1:1 문의"] },
          { h: "회사", items: ["소개", "채용", "제휴 문의", "이용약관"] },
        ].map((col) => (
          <div key={col.h}>
            <h3 className="text-sm font-semibold text-foreground">{col.h}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.items.map((i) => (
                <li key={i}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 py-5">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} StayScope. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
