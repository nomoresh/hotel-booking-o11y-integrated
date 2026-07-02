package com.hotel.user_service.controller.dto;

public record SignUpRequest(
    String name,
    String email,
    String password
) {}