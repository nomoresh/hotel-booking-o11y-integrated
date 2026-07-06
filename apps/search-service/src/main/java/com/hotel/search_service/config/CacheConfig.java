package com.hotel.search_service.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

// README에 명시된 "트래픽 분산을 위한 인메모리 캐싱" — 검색 결과를 인스턴스 힙 메모리에 직접 캐싱.
// (Redis처럼 여러 인스턴스가 공유하는 캐시가 아니라, 서비스 인스턴스마다 로컬로 유지됨)
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CaffeineCacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("hotels-search", "hotels-detail");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(1_000));
        return cacheManager;
    }
}
