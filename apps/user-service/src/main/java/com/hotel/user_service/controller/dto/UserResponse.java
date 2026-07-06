package com.hotel.user_service.controller.dto;

public record UserResponse(
    Long id,
    String name,
    String email
) {}