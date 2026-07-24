package com.hotel.event_service.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateBookingRequest(
        @NotBlank String hotelId,
        @NotBlank String hotelName,
        @NotBlank String roomType,
        @NotBlank String checkIn,
        @NotBlank String checkOut,
        @Positive int nights,
        @Positive int guests,
        @Positive int totalPrice,
        // 같은 hotelId라도 일반/특가 양쪽으로 예약 가능하므로, 어느 화면(버튼)에서 왔는지 클라이언트가 명시
        boolean eventDeal,
        // 특가 구매(eventDeal=true)일 때만 필요 — 대기열을 통과해 발급받은 입장 토큰.
        // 일반 예약은 대기열을 거치지 않으므로 null이어도 됨 (그래서 @NotBlank를 붙이지 않음).
        String admissionToken
) {}
