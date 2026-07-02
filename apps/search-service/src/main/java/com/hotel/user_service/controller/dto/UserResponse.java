package com.hotel.user_service.controller.dto;

public record UserResponse(
    String name,
    String email,
    String level
) {}