package com.hotel.search_service.controller;

import com.hotel.search_service.domain.Hotel;
import com.hotel.search_service.repository.HotelRepository;
import com.hotel.search_service.repository.HotelSpecifications;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

    // 조건이 모두 비어있으면 전체 목록 조회와 동일하게 동작 (기존 GET /api/v1/hotels 호출과 호환)
    @GetMapping
    // sync=true: 같은 조건으로 캐시가 비어있을 때 동시 요청이 몰리면, 한 스레드만 DB를 조회하고
    // 나머지는 그 결과가 캐시에 채워질 때까지 대기함 (없으면 요청마다 각자 DB로 새는 캐시 스탬피드 발생)
    @Cacheable(cacheNames = "hotels-search", key = "{#city, #keyword, #minPrice, #maxPrice, #minRating, #sort}", sync = true)
    public ResponseEntity<List<Hotel>> searchHotels(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false, defaultValue = "recommended") String sort
    ) {
        Specification<Hotel> spec = HotelSpecifications.filter(city, keyword, minPrice, maxPrice, minRating);
        List<Hotel> hotels = hotelRepository.findAll(spec, resolveSort(sort));
        return ResponseEntity.ok(hotels);
    }

    // sync=true는 unless와 함께 쓸 수 없어(Spring 제약) 404 응답도 TTL 동안 그대로 캐시됨 —
    // 호텔 마스터 데이터가 런타임에 추가되지 않는 현재 구조에서는 문제되지 않음
    @GetMapping("/{id}")
    @Cacheable(cacheNames = "hotels-detail", key = "#id", sync = true)
    public ResponseEntity<Hotel> getHotel(@PathVariable String id) {
        return hotelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private Sort resolveSort(String sort) {
        return switch (sort) {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            default -> Sort.by(Sort.Direction.DESC, "rating"); // recommended 기본값: 평점 높은 순
        };
    }
}
