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
        @Positive int totalPrice
) {}
