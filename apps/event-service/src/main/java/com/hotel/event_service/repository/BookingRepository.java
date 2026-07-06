package com.hotel.event_service.repository;

import com.hotel.event_service.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUserEmail(String userEmail);
}
