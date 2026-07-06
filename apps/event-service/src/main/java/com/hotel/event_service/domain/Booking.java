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

    public Booking(
            String id, String userEmail, String hotelId, String hotelName, String roomType,
            String checkIn, String checkOut, int nights, int guests, int totalPrice, String status
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
    }
}
