/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  /**
   * 로컬 개발 환경에서만 API 요청을 각 Spring Boot 서비스로 전달합니다.
   *
   * 예:
   * 브라우저가 localhost:3000/api/v1/hotels 요청
   * → Next.js가 localhost:8085/api/v1/hotels로 전달
   *
   * production에서는 rewrite를 사용하지 않습니다.
   * EKS의 ALB Ingress가 경로 기반 라우팅을 담당합니다.
   */
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return []
    }

    return [
      {
        source: "/api/v1/users/:path*",
        destination: "http://localhost:8083/api/v1/users/:path*",
      },
      {
        source: "/api/v1/hotels/:path*",
        destination: "http://localhost:8085/api/v1/hotels/:path*",
      },
      {
        source: "/api/v1/events/:path*",
        destination: "http://localhost:8084/api/v1/events/:path*",
      },
      {
        source: "/api/v1/bookings/:path*",
        destination: "http://localhost:8084/api/v1/bookings/:path*",
      },
      {
        source: "/api/v1/queue/:path*",
        destination: "http://localhost:8084/api/v1/queue/:path*",
      },
    ]
  },
}

export default nextConfig