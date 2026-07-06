package com.hotel.event_service.service;

import com.hotel.event_service.client.HotelPriceClient;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PricingService {

    private static final int EXTRA_GUEST_FEE_PER_NIGHT = 20000;
    private static final double SERVICE_FEE_RATE = 0.1;

    private final HotelPriceClient hotelPriceClient;

    public PricingService(HotelPriceClient hotelPriceClient) {
        this.hotelPriceClient = hotelPriceClient;
    }

    // 프론트(components/booking-panel.tsx)와 동일한 계산식으로 서버가 직접 재계산한 정상 결제 금액.
    // 호텔을 찾을 수 없으면 empty (hotelId 자체가 잘못된 경우).
    public Optional<Integer> calculateExpectedTotal(String hotelId, int nights, int guests, boolean isEventDeal) {
        return hotelPriceClient.getBasePrice(hotelId)
                .map(basePrice -> isEventDeal ? basePrice : expectedRegularTotal(basePrice, nights, guests));
    }

    private int expectedRegularTotal(int basePrice, int nights, int guests) {
        int extraGuestFee = guests > 2 ? (guests - 2) * EXTRA_GUEST_FEE_PER_NIGHT : 0;
        int roomTotal = (basePrice + extraGuestFee) * nights;
        int serviceFee = (int) Math.round(roomTotal * SERVICE_FEE_RATE);
        return roomTotal + serviceFee;
    }
}
