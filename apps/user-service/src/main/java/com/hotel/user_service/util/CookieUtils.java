package com.hotel.user_service.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtils {

    // Secure 쿠키는 HTTPS에서만 브라우저가 저장/전송함 — localhost는 브라우저가 예외로 봐줘서
    // 로컬 개발(HTTP)에선 문제없이 동작하지만, 실제 도메인(ALB 등)이 아직 HTTP만 지원하는 클러스터
    // 환경에서는 Secure=true인 채로 두면 로그인 자체가 안 되는 실제 장애로 이어짐 — 환경변수로 끌 수 있게 함.
    @Value("${cookie.secure:true}")
    private boolean secureCookie;

    // JWT 토큰을 HttpOnly 쿠키로 변환하는 메서드
    public ResponseCookie createAccessTokenCookie(String accessToken) {
        return ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)                // XSS 방어
                .secure(secureCookie)          // HTTPS 프로토콜에서만 전송 가능 (환경변수로 제어)
                .path("/")                     // 전체 경로에서 쿠키 유효
                .maxAge(12 * 60 * 60)          // 쿠키 수명 (12시간)
                .sameSite("Lax")               // 크로스 도메인 간 CSRF 방어와 인증 유연성 밸런스
                .build();
    }

    // 로그아웃 시 동일한 이름의 쿠키를 즉시 만료시키기 위한 메서드
    public ResponseCookie expireAccessTokenCookie() {
        return ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}