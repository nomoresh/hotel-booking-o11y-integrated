package com.hotel.event_service.repository;

import com.hotel.event_service.domain.EventDeal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventDealRepository extends JpaRepository<EventDeal, String> {
}
