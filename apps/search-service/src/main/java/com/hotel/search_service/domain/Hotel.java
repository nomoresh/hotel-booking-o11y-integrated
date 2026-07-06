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
    private String location;
    private int basePrice;
    private double rating;

    public Hotel(String id, String name, String location, int basePrice, double rating) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.basePrice = basePrice;
        this.rating = rating;
    }
}
