package com.hotel.search_service.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "hotels")
public class Hotel {

    @Id
    private String id;

    private String name;
    private String city;
    private String area;
    private int basePrice;
    private double rating;

    public Hotel(String id, String name, String city, String area, int basePrice, double rating) {
        this.id = id;
        this.name = name;
        this.city = city;
        this.area = area;
        this.basePrice = basePrice;
        this.rating = rating;
    }
}
