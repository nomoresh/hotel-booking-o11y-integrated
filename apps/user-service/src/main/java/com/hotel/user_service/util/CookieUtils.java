package com.hotel.user_service.util;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtils {

    // JWT 토큰을 HttpOnly 쿠키로 변환하는 메서드
    public ResponseCookie createAccessTokenCookie(String accessToken) {
        return ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)                // XSS 방어
                .secure(true)                  // HTTPS 프로토콜에서만 전송 가능
                .path("/")                     // 전체 경로에서 쿠키 유효
                .maxAge(12 * 60 * 60)          // 쿠키 수명 (12시간)
                .sameSite("Lax")               // 크로스 도메인 간 CSRF 방어와 인증 유연성 밸런스
                .build();
    }

    // 로그아웃 시 동일한 이름의 쿠키를 즉시 만료시키기 위한 메서드
    public ResponseCookie expireAccessTokenCookie() {
        return ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}