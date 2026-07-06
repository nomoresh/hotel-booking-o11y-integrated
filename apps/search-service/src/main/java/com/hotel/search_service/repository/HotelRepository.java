package com.hotel.search_service.repository;

import com.hotel.search_service.domain.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HotelRepository extends JpaRepository<Hotel, String> {
}
