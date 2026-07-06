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
        boolean eventDeal
) {}
