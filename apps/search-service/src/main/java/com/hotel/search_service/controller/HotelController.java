package com.hotel.search_service.controller;

import com.hotel.search_service.domain.Hotel;
import com.hotel.search_service.repository.HotelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/hotels")
public class HotelController {

    private final HotelRepository hotelRepository;

    public HotelController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public ResponseEntity<List<Hotel>> getAllHotels() {
        return ResponseEntity.ok(hotelRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hotel> getHotel(@PathVariable String id) {
        return hotelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
