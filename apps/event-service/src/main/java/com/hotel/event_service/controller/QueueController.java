package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.QueueStatus;
import com.hotel.event_service.security.JwtTokenProvider;
import com.hotel.event_service.service.QueueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 특가 대기열 API. 여기서 발급된 admissionToken은 BookingController의 특가 구매 요청에
// 그대로 실려서 검증된다.
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
