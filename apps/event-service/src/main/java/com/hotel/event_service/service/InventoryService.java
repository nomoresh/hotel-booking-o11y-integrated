package com.hotel.event_service.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

// 특가 재고를 Redis 원자 연산으로 관리해, 동시 요청이 몰려도 초과 판매(오버셀)가 나지 않도록 함.
@Service
public class InventoryService {

    private static final String KEY_PREFIX = "event:stock:";

    // GET 후 값이 0보다 클 때만 DECR 하는 것을 하나의 원자적 연산으로 묶은 스크립트.
    // "재고 확인"과 "차감"을 분리하면 그 사이에 다른 요청이 끼어들어 초과 판매가 발생할 수 있음.
    private static final DefaultRedisScript<Long> DECREMENT_IF_POSITIVE = new DefaultRedisScript<>(
            """
            local current = tonumber(redis.call('GET', KEYS[1]))
            if current == nil then
                return -2
            end
            if current > 0 then
                return redis.call('DECR', KEYS[1])
            else
                return -1
            end
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;

    public InventoryService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void initializeStockIfAbsent(String dealId, int totalStock) {
        redisTemplate.opsForValue().setIfAbsent(key(dealId), String.valueOf(totalStock));
    }

    // true: 재고 1개 확보 성공, false: 이미 매진되었거나 존재하지 않는 상품
    public boolean tryReserve(String dealId) {
        Long result = redisTemplate.execute(DECREMENT_IF_POSITIVE, List.of(key(dealId)));
        return result != null && result >= 0;
    }

    // 예약 확보 후 실제 예약 생성이 실패했을 때 재고를 되돌리기 위한 보상 처리
    public void restore(String dealId) {
        redisTemplate.opsForValue().increment(key(dealId));
    }

    public Integer getRemaining(String dealId) {
        String value = redisTemplate.opsForValue().get(key(dealId));
        return value != null ? Integer.parseInt(value) : null;
    }

    private String key(String dealId) {
        return KEY_PREFIX + dealId;
    }
}
