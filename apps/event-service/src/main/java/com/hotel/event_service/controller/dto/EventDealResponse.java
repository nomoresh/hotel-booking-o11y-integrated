package com.hotel.event_service.controller.dto;

public record EventDealResponse(
        String dealId,
        int totalStock,
        int remaining,
        boolean soldOut
) {}
