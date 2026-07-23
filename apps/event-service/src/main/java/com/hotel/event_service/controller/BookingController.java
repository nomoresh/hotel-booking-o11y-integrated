package com.hotel.event_service.controller;

import com.hotel.event_service.controller.dto.CreateBookingRequest;
import com.hotel.event_service.domain.Booking;
import com.hotel.event_service.repository.BookingRepository;
import com.hotel.event_service.repository.EventDealRepository;
import com.hotel.event_service.security.JwtTokenProvider;
import com.hotel.event_service.service.InventoryService;
import com.hotel.event_service.service.PricingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final EventDealRepository eventDealRepository;
    private final InventoryService inventoryService;
    private final PricingService pricingService;
    private final JwtTokenProvider jwtTokenProvider;

    public BookingController(
            BookingRepository bookingRepository,
            EventDealRepository eventDealRepository,
            InventoryService inventoryService,
            PricingService pricingService,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.bookingRepository = bookingRepository;
        this.eventDealRepository = eventDealRepository;
        this.inventoryService = inventoryService;
        this.pricingService = pricingService;
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

        // hotelId만으로는 일반/특가를 구분할 수 없음 (같은 호텔이 둘 다로 예약될 수 있음) — 클라이언트가 명시한 값을 신뢰하되,
        // 특가라고 주장하는데 실제 특가 상품이 아니면 거부
        boolean isEventDeal = request.eventDeal();
        if (isEventDeal && !eventDealRepository.existsById(request.hotelId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "존재하지 않는 특가 상품입니다."));
        }

        // 결제 금액이 프론트에서 조작되지 않았는지 search-service의 실제 가격으로 재검증
        Optional<Integer> expectedTotal;
        try {
            expectedTotal = pricingService.calculateExpectedTotal(
                    request.hotelId(), request.nights(), request.guests(), isEventDeal
            );
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "가격 정보를 확인할 수 없어 예약을 생성할 수 없습니다. 잠시 후 다시 시도해주세요."));
        }
        if (expectedTotal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "존재하지 않는 호텔입니다."));
        }
        if (!expectedTotal.get().equals(request.totalPrice())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "결제 금액이 올바르지 않습니다."));
        }

        // 특가 구매인 경우에만 인당 구매 제한 확인 후 선착순 재고 확보를 시도 (일반 예약은 통과)
        if (isEventDeal && bookingRepository.existsByUserEmailAndHotelIdAndEventDealTrue(email, request.hotelId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "이 특가 상품은 인당 1개까지만 구매할 수 있습니다."));
        }
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
                "CONFIRMED",
                isEventDeal
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

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @CookieValue(value = "access_token", required = false) String token,
            @PathVariable String id
    ) {
        String email = authenticate(token);
        if (email == null) {
            return unauthorized();
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        // 존재하지 않는 예약과 남의 예약을 구분해서 알려주지 않음 (정보 노출 방지)
        if (booking == null || !booking.getUserEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "예약을 찾을 수 없습니다."));
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 취소된 예약입니다."));
        }
        if (booking.isEventDeal()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "특가 상품은 취소할 수 없습니다."));
        }

        LocalDate checkInDate = LocalDate.parse(booking.getCheckIn());
        if (!LocalDate.now(ZoneId.of("Asia/Seoul")).isBefore(checkInDate)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "체크인 하루 전까지만 취소할 수 있습니다."));
        }

        booking.cancel();
        return ResponseEntity.ok(bookingRepository.save(booking));
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
