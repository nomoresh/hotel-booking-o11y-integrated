package com.hotel.search_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 컨트롤러마다 @CrossOrigin을 따로 붙이던 걸 한 곳으로 모음.
// 허용 출처는 application.yaml의 cors.allowed-origins(콤마로 여러 개 가능)에서 읽어오므로,
// 로컬(localhost:3000)과 배포 환경(클러스터 프론트 주소)을 환경변수로 구분해서 넣을 수 있음.
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
