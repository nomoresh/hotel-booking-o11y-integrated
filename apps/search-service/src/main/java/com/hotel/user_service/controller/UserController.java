package com.hotel.user_service.controller;

import com.hotel.user_service.controller.dto.LoginRequest;
import com.hotel.user_service.controller.dto.SignUpRequest;
import com.hotel.user_service.controller.dto.UserResponse;
import com.hotel.user_service.security.JwtTokenProvider;
import com.hotel.user_service.util.CookieUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtils cookieUtils;

    @PostMapping("/signup")
    public ResponseEntity<Void> signUp(@RequestBody SignUpRequest request) {
        // TODO: userService.signUp(request) 비즈니스 로직 연동 (비밀번호 BCrypt 암호화 필수)
        log.info("[SignUp Success] Email: {}", request.email());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request) {
        // TODO: userService.validateUser(request.email(), request.password()) 검증 로직 영역
        
        // 가상의 인증 통과 및 등급 부여 설정
        String userEmail = request.email();
        String userRole = "VIP"; 
        String userName = "홍길동";

        // 1. 검증 완료 후 유저 정보 기반 JWT 토큰 생성
        String accessToken = jwtTokenProvider.createToken(userEmail, userRole);

        // 2. JWT 토큰을 품은 HttpOnly ResponseCookie 오브젝트 빌드
        ResponseCookie cookie = cookieUtils.createAccessTokenCookie(accessToken);

        log.info("[Login Success] Email: {} | Role: {}", userEmail, userRole);

        // 3. 응답 헤더에 Set-Cookie 세팅 후 Body와 함께 전송
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new UserResponse(userName, userEmail, userRole));
    }
}