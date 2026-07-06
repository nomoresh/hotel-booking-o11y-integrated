package com.hotel.event_service.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "bookings")
public class Booking {

    @Id
    private String id;
    private String userEmail;
    private String hotelId;
    private String hotelName;
    private String roomType;
    private String checkIn;
    private String checkOut;
    private int nights;
    private int guests;
    private int totalPrice;
    private String status;
    // hotelId만으로는 "이 예약이 특가였는지"를 알 수 없음 (같은 호텔이 일반/특가 양쪽으로 예약될 수 있음).
    // 예약 생성 시점의 실제 구매 경로를 그대로 저장해서, 취소 등 이후 로직이 hotelId 재추론 없이 이 값을 신뢰하도록 함.
    private boolean eventDeal;

    public Booking(
            String id, String userEmail, String hotelId, String hotelName, String roomType,
            String checkIn, String checkOut, int nights, int guests, int totalPrice, String status,
            boolean eventDeal
    ) {
        this.id = id;
        this.userEmail = userEmail;
        this.hotelId = hotelId;
        this.hotelName = hotelName;
        this.roomType = roomType;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.nights = nights;
        this.guests = guests;
        this.totalPrice = totalPrice;
        this.status = status;
        this.eventDeal = eventDeal;
    }

    public void cancel() {
        this.status = "CANCELLED";
    }
}
