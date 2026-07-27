package com.hotel.event_service.service;

import com.hotel.event_service.domain.Booking;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.TraceContext;
import io.micrometer.tracing.propagation.Propagator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

// 예약 완료 시 notice-service가 비동기로 알림을 보낼 수 있도록 Redis Stream에 이벤트를 발행한다.
// 스트림 키(booking-notifications)는 notice-service의 application.yaml(notice.stream.key)과
// 반드시 일치해야 함 — 두 서비스가 별개 배포 단위라 공유 상수로 못 묶어서 여기 주석으로만 남김.
//
// HTTP 호출은 RestClient가 트레이스 헤더를 자동으로 실어주지만, Redis Stream은 그런 자동 계측이
// 없어서 Propagator로 현재 트레이스 컨텍스트를 수동으로 필드에 주입(inject)한다.
// notice-service가 그 필드를 추출(extract)해서 같은 트레이스로 이어붙인다.
@Service
public class NotificationPublisher {

    private static final String STREAM_KEY = "booking-notifications";

    private final StringRedisTemplate redisTemplate;
    private final Tracer tracer;
    private final Propagator propagator;

    public NotificationPublisher(StringRedisTemplate redisTemplate, Tracer tracer, Propagator propagator) {
        this.redisTemplate = redisTemplate;
        this.tracer = tracer;
        this.propagator = propagator;
    }

    public void publishBookingCompleted(Booking booking) {
        Map<String, String> record = new HashMap<>();
        record.put("bookingId", booking.getId());
        record.put("userEmail", booking.getUserEmail());
        record.put("hotelName", booking.getHotelName());
        record.put("eventDeal", String.valueOf(booking.isEventDeal()));

        TraceContext currentContext = tracer.currentTraceContext().context();
        if (currentContext != null) {
            propagator.inject(currentContext, record, Map::put);
        }

        redisTemplate.opsForStream().add(STREAM_KEY, record);
    }
}
