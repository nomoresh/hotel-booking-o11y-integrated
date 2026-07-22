/**
 * 모든 API 요청은 상대 경로 사용.
 *
 * 로컬 개발:
 *   브라우저 → Next.js localhost:3000/api/v1/...
 *   Next.js rewrite → 각 로컬 백엔드 서비스
 *
 * EKS 배포:
 *   브라우저 → ALB 주소/api/v1/...
 *   ALB Ingress → 각 Kubernetes Service
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  if (!endpoint.startsWith("/")) {
    throw new Error(`API endpoint는 "/"로 시작해야 합니다: ${endpoint}`)
  }

  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)

    const message =
      errorData &&
      typeof errorData === "object" &&
      "message" in errorData &&
      typeof errorData.message === "string"
        ? errorData.message
        : `API 요청에 실패했습니다. HTTP ${response.status}`

    const error = new Error(message) as Error & {
      status?: number
      data?: unknown
    }

    error.status = response.status
    error.data = errorData

    throw error
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}