package com.hotel.event_service.config;

import com.hotel.event_service.domain.EventDeal;
import com.hotel.event_service.repository.EventDealRepository;
import com.hotel.event_service.service.InventoryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EventDealSeeder implements CommandLineRunner {

    private final EventDealRepository eventDealRepository;
    private final InventoryService inventoryService;

    public EventDealSeeder(EventDealRepository eventDealRepository, InventoryService inventoryService) {
        this.eventDealRepository = eventDealRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    public void run(String... args) {
        if (eventDealRepository.count() == 0) {
            eventDealRepository.saveAll(List.of(
                    new EventDeal("seaside-jeju", 20),
                    new EventDeal("urban-seoul", 30)
            ));
        }

        // Redis 잔여 수량은 최초 1회만 초기화 (재시작 시 이미 판매된 재고를 되살리지 않기 위함)
        eventDealRepository.findAll()
                .forEach(deal -> inventoryService.initializeStockIfAbsent(deal.getId(), deal.getTotalStock()));
    }
}
