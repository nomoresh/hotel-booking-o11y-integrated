package com.hotel.event_service.repository;

import com.hotel.event_service.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUserEmail(String userEmail);

    // 같은 hotelId라도 일반 예약과 특가 구매는 별개이므로, 특가 인당 구매 제한은 eventDeal=true인 것만 확인
    boolean existsByUserEmailAndHotelIdAndEventDealTrue(String userEmail, String hotelId);
}
