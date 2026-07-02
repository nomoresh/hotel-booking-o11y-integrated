import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ConfirmationDetails } from "@/components/confirmation-details"

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30">
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-muted-foreground">
              예약 정보를 불러오는 중...
            </div>
          }
        >
          <ConfirmationDetails />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
