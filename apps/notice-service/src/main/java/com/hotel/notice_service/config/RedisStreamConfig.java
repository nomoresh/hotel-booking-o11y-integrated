package com.hotel.notice_service.config;

import com.hotel.notice_service.listener.BookingNotificationListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.StreamMessageListenerContainer.StreamMessageListenerContainerOptions;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

// event-service가 예약 완료 시 발행하는 Redis Stream(booking-notifications)을 컨슈머 그룹으로 구독.
// 컨슈머 그룹을 쓰는 이유: 단순 Pub/Sub과 달리, notice-service가 잠깐 내려가 있어도
// 메시지가 스트림에 남아있어 재시작 후 이어받을 수 있음(at-least-once).
@Slf4j
@Configuration
public class RedisStreamConfig {

    @Value("${notice.stream.key}")
    private String streamKey;

    @Value("${notice.stream.group}")
    private String group;

    // destroyMethod="stop" — 컨텍스트 종료 시 Redis 커넥션이 먼저 끊기기 전에 poll 스레드를 멈춰서,
    // 종료 시점에 "Connection closed" 에러 로그가 시끄럽게 남는 걸 방지
    @Bean(destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamContainer(
            RedisConnectionFactory connectionFactory,
            StringRedisTemplate redisTemplate,
            BookingNotificationListener listener
    ) {
        ensureGroupExists(redisTemplate);

        StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofSeconds(2))
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(connectionFactory, options);

        // 컨슈머 이름을 인스턴스마다 다르게 줘서, 나중에 replica를 여러 개 띄워도 같은 메시지를 중복 소비하지 않게 함
        String consumerName = "notice-service-" + UUID.randomUUID();
        container.receive(
                Consumer.from(group, consumerName),
                StreamOffset.create(streamKey, ReadOffset.lastConsumed()),
                listener
        );
        container.start();
        return container;
    }

    private void ensureGroupExists(StringRedisTemplate redisTemplate) {
        try {
            // XGROUP CREATE는 스트림 자체가 없으면 실패하므로, 더미 레코드로 스트림 존재부터 보장
            if (Boolean.FALSE.equals(redisTemplate.hasKey(streamKey))) {
                redisTemplate.opsForStream().add(streamKey, Map.of("_init", "true"));
            }
            redisTemplate.opsForStream().createGroup(streamKey, ReadOffset.from("0"), group);
        } catch (Exception e) {
            // 그룹이 이미 있는 경우 "BUSYGROUP" 에러가 남 — 서비스 재시작 시 정상적으로 발생하는 상황이라 무시
            log.debug("Consumer group already exists: {}", e.getMessage());
        }
    }
}
