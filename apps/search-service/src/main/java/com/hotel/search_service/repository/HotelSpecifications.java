package com.hotel.search_service.repository;

import com.hotel.search_service.domain.Hotel;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class HotelSpecifications {

    private HotelSpecifications() {}

    public static Specification<Hotel> filter(
            String city, String keyword, Integer minPrice, Integer maxPrice, Double minRating
    ) {
        List<Specification<Hotel>> specs = new ArrayList<>();

        if (StringUtils.hasText(city)) {
            specs.add((root, query, cb) -> cb.equal(root.get("city"), city));
        }
        if (StringUtils.hasText(keyword)) {
            String pattern = "%" + keyword.toLowerCase() + "%";
            specs.add((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("city")), pattern),
                    cb.like(cb.lower(root.get("area")), pattern)
            ));
        }
        if (minPrice != null) {
            specs.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
        }
        if (maxPrice != null) {
            specs.add((root, query, cb) -> cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
        }
        if (minRating != null) {
            specs.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        }

        return specs.stream().reduce(Specification::and).orElse((root, query, cb) -> cb.conjunction());
    }
}
