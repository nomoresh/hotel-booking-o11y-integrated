package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.QueueStatus;
import com.hotel.event_service.security.JwtTokenProvider;
import com.hotel.event_service.service.QueueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 특가 대기열 API — 기존 예약 생성(BookingController)과는 완전히 분리된 신규 기능.
// 아직 예약 생성 API가 이 입장 토큰을 요구하지 않는다 (연결은 별도 단계로 남겨둠).
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/queue")
public class QueueController {

    private final QueueService queueService;
    private final JwtTokenProvider jwtTokenProvider;

    public QueueController(QueueService queueService, JwtTokenProvider jwtTokenProvider) {
        this.queueService = queueService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/{dealId}/join")
    public ResponseEntity<?> join(
            @CookieValue(value = "access_token", required = false) String token,
            @PathVariable String dealId
    ) {
        String email = authenticate(token);
        if (email == null) {
            return unauthorized();
        }

        queueService.join(dealId, email);
        return ResponseEntity.ok(queueService.checkStatus(dealId, email));
    }

    @GetMapping("/{dealId}/status")
    public ResponseEntity<?> status(
            @CookieValue(value = "access_token", required = false) String token,
            @PathVariable String dealId
    ) {
        String email = authenticate(token);
        if (email == null) {
            return unauthorized();
        }

        return ResponseEntity.ok(queueService.checkStatus(dealId, email));
    }

    private String authenticate(String token) {
        if (token == null || !jwtTokenProvider.isValid(token)) {
            return null;
        }
        return jwtTokenProvider.getEmail(token);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
    }
}
