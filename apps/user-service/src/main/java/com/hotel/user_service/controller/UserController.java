package com.hotel.user_service.controller;

import com.hotel.user_service.controller.dto.LoginRequest;
import com.hotel.user_service.controller.dto.SignUpRequest;
import com.hotel.user_service.controller.dto.UserResponse;
import com.hotel.user_service.domain.User;
import com.hotel.user_service.repository.UserRepository;
import com.hotel.user_service.security.JwtTokenProvider;
import com.hotel.user_service.util.CookieUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    // 아직 등급 체계가 없어 모든 신규 가입자에게 고정으로 부여하는 기본 역할.
    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtils cookieUtils;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@Valid @RequestBody SignUpRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "이미 가입된 이메일입니다."));
        }

        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.name());
        User saved = userRepository.save(user);

        log.info("[SignUp Success] Email: {}", saved.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserResponse(saved.getId(), saved.getName(), saved.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }

        // 검증 완료 후 유저 정보 기반 JWT 토큰 생성, HttpOnly 쿠키로 전달
        String accessToken = jwtTokenProvider.createToken(user.getEmail(), DEFAULT_ROLE);
        ResponseCookie cookie = cookieUtils.createAccessTokenCookie(accessToken);

        log.info("[Login Success] Email: {}", user.getEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new UserResponse(user.getId(), user.getName(), user.getEmail()));
    }
}