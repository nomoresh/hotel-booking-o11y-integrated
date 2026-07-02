package com.hotel.user_service.controller.dto;

public record LoginRequest(
    String email,
    String password
) {}