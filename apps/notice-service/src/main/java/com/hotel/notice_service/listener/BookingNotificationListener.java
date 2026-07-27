package com.hotel.notice_service.listener;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.propagation.Propagator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;

import java.util.Map;

// event-service가 예약 완료 시 Redis Stream에 발행한 메시지를 소비해 알림을 "발송"한다.
// 실제 이메일/SMS 연동은 없고(외부 발신 채널 미확보), 대신 이 서비스가 실제로 비동기 메시지를
// 받아서 처리하는 것과, 그 처리가 예약 생성 트레이스와 하나로 이어지는 것을 보여주는 게 목적.
//
// 트레이스 전파: HTTP 요청은 RestClient가 자동으로 헤더에 trace 정보를 실어주지만, Redis Stream은
// 그런 자동 계측이 없어서 event-service가 발행 시 Propagator로 수동 주입(inject)한 필드를
// 여기서 수동으로 추출(extract)해 새 span의 parent로 연결해준다.
@Slf4j
@Component
public class BookingNotificationListener implements StreamListener<String, MapRecord<String, String, String>> {

    private final Tracer tracer;
    private final Propagator propagator;
    private final StringRedisTemplate redisTemplate;

    @Value("${notice.stream.key}")
    private String streamKey;

    @Value("${notice.stream.group}")
    private String group;

    public BookingNotificationListener(Tracer tracer, Propagator propagator, StringRedisTemplate redisTemplate) {
        this.tracer = tracer;
        this.propagator = propagator;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        Map<String, String> data = message.getValue();

        // 초기화용 더미 레코드(RedisStreamConfig에서 스트림 생성 목적으로 넣은 것)는 그냥 건너뜀
        if (data.containsKey("_init")) {
            redisTemplate.opsForStream().acknowledge(streamKey, group, message.getId());
            return;
        }

        Span span = propagator.extract(data, Map::get)
                .name("notice-service.process-booking-notification")
                .start();

        try (Tracer.SpanInScope ignored = tracer.withSpan(span)) {
            log.info(
                    "알림 발송: bookingId={} userEmail={} hotelName={} eventDeal={}",
                    data.get("bookingId"), data.get("userEmail"), data.get("hotelName"), data.get("eventDeal")
            );
        } catch (Exception e) {
            span.error(e);
            log.error("알림 처리 실패: bookingId={}", data.get("bookingId"), e);
        } finally {
            span.end();
        }

        // 처리 완료를 명시적으로 ack — 안 하면 컨슈머 그룹의 pending 목록에 계속 남음
        redisTemplate.opsForStream().acknowledge(streamKey, group, message.getId());
    }
}
