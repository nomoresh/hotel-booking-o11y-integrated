package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.EventDealResponse;
import com.hotel.event_service.domain.EventDeal;
import com.hotel.event_service.repository.EventDealRepository;
import com.hotel.event_service.service.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class EventDealController {

    private final EventDealRepository eventDealRepository;
    private final InventoryService inventoryService;

    public EventDealController(EventDealRepository eventDealRepository, InventoryService inventoryService) {
        this.eventDealRepository = eventDealRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<EventDealResponse>> getAllDeals() {
        return ResponseEntity.ok(eventDealRepository.findAll().stream().map(this::toResponse).toList());
    }

    @GetMapping("/{dealId}")
    public ResponseEntity<EventDealResponse> getDeal(@PathVariable String dealId) {
        return eventDealRepository.findById(dealId)
                .map(deal -> ResponseEntity.ok(toResponse(deal)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private EventDealResponse toResponse(EventDeal deal) {
        Integer remaining = inventoryService.getRemaining(deal.getId());
        int safeRemaining = remaining != null ? remaining : 0;
        return new EventDealResponse(deal.getId(), deal.getTotalStock(), safeRemaining, safeRemaining <= 0);
    }
}
