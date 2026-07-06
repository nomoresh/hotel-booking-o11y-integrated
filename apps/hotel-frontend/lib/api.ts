// API 게이트웨이 없이 서비스별로 포트가 분리되어 있어, 경로 접두사로 백엔드를 구분합니다.
const SERVICE_BASE_URLS: Record<string, string> = {
  "/api/v1/users": process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:8083",
  "/api/v1/bookings": process.env.NEXT_PUBLIC_EVENT_API_URL || "http://localhost:8084",
  "/api/v1/events": process.env.NEXT_PUBLIC_EVENT_API_URL || "http://localhost:8084",
  "/api/v1/hotels": process.env.NEXT_PUBLIC_SEARCH_API_URL || "http://localhost:8085",
}

function resolveBaseUrl(endpoint: string): string {
  const prefix = Object.keys(SERVICE_BASE_URLS).find((p) => endpoint.startsWith(p))
  return prefix ? SERVICE_BASE_URLS[prefix] : ""
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${resolveBaseUrl(endpoint)}${endpoint}`

  // CORS 상황에서 HttpOnly 쿠키를 주고받으려면 자격 증명(credentials) 설정이 필수입니다.
  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  const response = await fetch(url, defaultOptions)

  if (!response.ok) {
    // 관찰성 빌드업: 에러 발생 시 HTTP 상태 코드를 담아 커스텀 에러를 던집니다.
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.message || "API 요청 중 오류가 발생했습니다.")
    ;(error as any).status = response.status
    throw error
  }

  // 204 No Content나 로그아웃처럼 본문이 비어있는 200 응답도 안전하게 처리
  const text = await response.text()
  return text ? JSON.parse(text) : null
}