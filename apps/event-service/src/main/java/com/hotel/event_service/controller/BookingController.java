package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.CreateBookingRequest;
import com.hotel.event_service.domain.Booking;
import com.hotel.event_service.repository.BookingRepository;
import com.hotel.event_service.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public BookingController(BookingRepository bookingRepository, JwtTokenProvider jwtTokenProvider) {
        this.bookingRepository = bookingRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyBookings(@CookieValue(value = "access_token", required = false) String token) {
        String email = authenticate(token);
        if (email == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(bookingRepository.findByUserEmail(email));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @CookieValue(value = "access_token", required = false) String token,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        String email = authenticate(token);
        if (email == null) {
            return unauthorized();
        }

        Booking booking = new Booking(
                UUID.randomUUID().toString(),
                email,
                request.hotelId(),
                request.hotelName(),
                request.roomType(),
                request.checkIn(),
                request.checkOut(),
                request.nights(),
                request.guests(),
                request.totalPrice(),
                "CONFIRMED"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(bookingRepository.save(booking));
    }

    private String authenticate(String token) {
        if (token == null || !jwtTokenProvider.isValid(token)) {
            return null;
        }
        return jwtTokenProvider.getEmail(token);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
    }
}
