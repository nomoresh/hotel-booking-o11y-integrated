"use client"

import { useEffect, useState } from "react"

export interface AuthUser {
  id: number
  name: string
  email: string
}

const STORAGE_KEY = "auth_user"
const AUTH_EVENT = "auth-changed"

// 실제 인증 토큰은 HttpOnly 쿠키에 있어 JS에서 읽을 수 없으므로,
// 화면 표시용 사용자 정보만 로컬스토리지에 캐시해 둡니다.
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    setIsLoading(false)

    const handleChange = () => setUser(getStoredUser())
    window.addEventListener(AUTH_EVENT, handleChange)
    window.addEventListener("storage", handleChange)
    return () => {
      window.removeEventListener(AUTH_EVENT, handleChange)
      window.removeEventListener("storage", handleChange)
    }
  }, [])

  return { user, isLoading }
}
