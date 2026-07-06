package com.hotel.event_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Optional;

// 결제 금액 검증을 위해 search-service에서 호텔의 정가(basePrice)를 조회.
// search-service가 응답하지 않으면(RestClientException) 호출부에서 503으로 처리함.
@Component
public class HotelPriceClient {

    private final RestClient restClient;

    // RestClient.create(baseUrl) 대신 Spring이 자동 구성한 RestClient.Builder를 주입받아 사용해야
    // 관측(Observation) 계측이 붙어서 트레이스 컨텍스트가 이 호출을 통해 search-service로 전파됨
    public HotelPriceClient(RestClient.Builder restClientBuilder, @Value("${search-service.base-url}") String baseUrl) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    public Optional<Integer> getBasePrice(String hotelId) {
        try {
            HotelPriceResponse response = restClient.get()
                    .uri("/api/v1/hotels/{id}", hotelId)
                    .retrieve()
                    .body(HotelPriceResponse.class);
            return Optional.ofNullable(response).map(HotelPriceResponse::basePrice);
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }

    private record HotelPriceResponse(String id, int basePrice) {}
}
