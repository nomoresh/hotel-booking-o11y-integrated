package com.hotel.search_service.config;

import com.hotel.search_service.domain.Hotel;
import com.hotel.search_service.repository.HotelRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class HotelDataSeeder implements CommandLineRunner {

    private final HotelRepository hotelRepository;

    public HotelDataSeeder(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    @Override
    public void run(String... args) {
        if (hotelRepository.count() > 0) {
            return;
        }

        hotelRepository.saveAll(java.util.List.of(
                new Hotel("seaside-jeju", "시사이드 오션 리조트", "제주", "중문 · 오션뷰", 189000, 4.8),
                new Hotel("urban-seoul", "어반 스카이 호텔", "서울", "강남 · 도심", 142000, 4.6),
                new Hotel("hanok-jeonju", "고요 한옥 스테이", "전주", "한옥마을", 168000, 4.9),
                new Hotel("mountain-gangwon", "마운틴 스파 리트릿", "강원", "평창 · 스키인아웃", 215000, 4.7),
                new Hotel("boutique-busan", "웨이브 부티크 호텔", "부산", "해운대 · 오션뷰", 128000, 4.5),
                new Hotel("city-incheon", "에어포트 트랜짓 스테이", "인천", "공항 인근", 98000, 4.3)
        ));
    }
}
