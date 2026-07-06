package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.CreateBookingRequest;
import com.hotel.event_service.domain.Booking;
import com.hotel.event_service.repository.BookingRepository;
import com.hotel.event_service.repository.EventDealRepository;
import com.hotel.event_service.security.JwtTokenProvider;
import com.hotel.event_service.service.InventoryService;
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
    private final EventDealRepository eventDealRepository;
    private final InventoryService inventoryService;
    private final JwtTokenProvider jwtTokenProvider;

    public BookingController(
            BookingRepository bookingRepository,
            EventDealRepository eventDealRepository,
            InventoryService inventoryService,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.bookingRepository = bookingRepository;
        this.eventDealRepository = eventDealRepository;
        this.inventoryService = inventoryService;
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

        // hotelId가 특가 상품과 일치하면 선착순 재고 확보를 먼저 시도 (일반 예약은 재고 개념이 없어 통과)
        boolean isEventDeal = eventDealRepository.existsById(request.hotelId());
        if (isEventDeal && !inventoryService.tryReserve(request.hotelId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "선착순 마감되었습니다."));
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

        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(bookingRepository.save(booking));
        } catch (RuntimeException e) {
            // 예약 저장이 실패하면 이미 차감한 재고를 되돌림 (재고 유실 방지)
            if (isEventDeal) {
                inventoryService.restore(request.hotelId());
            }
            throw e;
        }
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
