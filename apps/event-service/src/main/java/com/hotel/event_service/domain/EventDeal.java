package com.hotel.event_service.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 특가 이벤트 재고의 "최초 수량"을 기록하는 원장. 실시간 잔여 수량은 Redis가 들고 있음.
@Entity
@Getter
@NoArgsConstructor
@Table(name = "event_deals")
public class EventDeal {

    @Id
    private String id; // hotelId와 동일한 값을 사용 (특가 상품 식별자)

    private int totalStock;

    public EventDeal(String id, int totalStock) {
        this.id = id;
        this.totalStock = totalStock;
    }
}
