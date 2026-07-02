const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`
  
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

  // 204 No Content 같은 응답 처리
  if (response.status === 204) return null
  return response.json()
}