package com.hotel.event_service.service;

import com.hotel.event_service.controller.dto.QueueStatus;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

// 특가 대기열: 동시 접속이 처리 용량(CAPACITY)을 넘으면 순서대로 대기시키고,
// 자리가 나면 입장 토큰을 발급해 예약 API에 접근할 수 있게 한다.
//
// BookingController가 특가 구매 시 isValidToken()으로 이 토큰을 검증하고,
// 구매 성공 시 release()로 슬롯을 반납한다.
@Service
public class QueueService {

    private static final String WAITING_KEY_PREFIX = "queue:waiting:";   // ZSet: userEmail -> 진입 시각(score)
    private static final String ADMITTED_KEY_PREFIX = "queue:admitted:"; // ZSet: userEmail -> 슬롯 만료 시각(score)
    private static final String TOKEN_KEY_PREFIX = "queue:token:";       // String: token 값 (TTL 있음)

    private static final long CAPACITY = 50; // 동시에 예약을 시도할 수 있는 인원 (데모용 값)
    private static final long ADMISSION_TTL_SECONDS = 300; // 입장 후 5분 안에 구매를 마쳐야 함, 지나면 슬롯 회수
    private static final long ESTIMATED_SECONDS_PER_PERSON = 2; // 순번 예상 대기시간 계산용 (데모용 단순 추정치)

    // "여유 슬롯 확인 + 대기열 맨 앞부터 이동"을 하나의 원자적 연산으로 묶음.
    // Java 코드에서 "확인 후 처리"로 나눠서 하면(check-then-act), 동시 요청이 몰릴 때
    // 여러 스레드가 동시에 "슬롯 남았다"고 착각해서 CAPACITY보다 더 많이 승격시키는
    // 경쟁 상태(race condition)가 생김 — InventoryService의 재고 차감과 동일한 이유로 Lua 사용.
    private static final DefaultRedisScript<List> PROMOTE_SCRIPT = new DefaultRedisScript<>(
            """
            redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])
            local admittedCount = redis.call('ZCARD', KEYS[1])
            local openSlots = tonumber(ARGV[1]) - admittedCount
            if openSlots <= 0 then
                return {}
            end
            local promoted = redis.call('ZRANGE', KEYS[2], 0, openSlots - 1)
            for i, member in ipairs(promoted) do
                redis.call('ZREM', KEYS[2], member)
                redis.call('ZADD', KEYS[1], ARGV[3], member)
            end
            return promoted
            """,
            List.class
    );

    private final StringRedisTemplate redisTemplate;

    public QueueService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // 대기열 진입: 이미 대기 중이거나 이미 입장한 유저면 중복으로 넣지 않음 (addIfAbsent)
    public void join(String dealId, String userEmail) {
        redisTemplate.opsForZSet().addIfAbsent(waitingKey(dealId), userEmail, System.currentTimeMillis());
    }

    // 현재 상태 조회 + 자리가 나면 대기열 맨 앞부터 자동 승격
    public QueueStatus checkStatus(String dealId, String userEmail) {
        promoteIfCapacityAvailable(dealId);

        // "승격 집합(admitted ZSet)에 속해 있는가"를 기준으로 판단한다 — 토큰 존재 여부로 판단하면 안 됨.
        // Lua 스크립트가 "대기열 제거 + 승격 집합 추가"까지는 원자적으로 끝내지만, 그 사람 몫의
        // 토큰 발급은 그 직후 Java 코드에서 개별적으로 이뤄지기 때문에, 그 짧은 틈에 상태를 조회하면
        // "대기열에도 없고 토큰도 없는" 것처럼 보이는 순간이 있었음 (실제로 겪은 버그).
        // 승격 집합 멤버십을 기준으로 삼고, 토큰이 아직 없으면 그 자리에서 만들어주면(get-or-create) 이 틈이 없어짐.
        Double admittedScore = redisTemplate.opsForZSet().score(admittedKey(dealId), userEmail);
        if (admittedScore != null) {
            String token = getOrCreateToken(dealId, userEmail);
            return QueueStatus.admitted(token);
        }

        Long rank = redisTemplate.opsForZSet().rank(waitingKey(dealId), userEmail);
        if (rank == null) {
            return QueueStatus.notInQueue();
        }

        Long totalWaiting = redisTemplate.opsForZSet().zCard(waitingKey(dealId));
        long position = rank + 1;
        long estimatedSeconds = position * ESTIMATED_SECONDS_PER_PERSON;
        return QueueStatus.waiting(position, totalWaiting == null ? 0 : totalWaiting, estimatedSeconds);
    }

    // get-then-set은 원자적이지 않아서, 같은 유저가 동시에 두 요청(예: 본인의 status
    // 폴링 + 다른 유저 요청이 유발한 전역 승격 부수효과)에서 동시에 승격 처리되면
    // 서로 다른 토큰을 만들어 마지막에 쓴 쪽이 이기는 경쟁 상태가 생김 — 클라이언트는
    // 먼저 응답받은(하지만 나중에 덮어써진) 토큰을 들고 있다가 예약 시점에 검증 실패함.
    // setIfAbsent(SETNX)로 "최초 성공한 쓰기만 유효"하게 만들고, 실패하면 이미 저장된
    // 값을 그대로 읽어서 반환해 모든 호출자가 같은 토큰을 보게 한다.
    private String getOrCreateToken(String dealId, String userEmail) {
        String key = tokenKey(dealId, userEmail);
        String existing = redisTemplate.opsForValue().get(key);
        if (existing != null) {
            return existing;
        }
        String token = UUID.randomUUID().toString();
        Boolean wasSet = redisTemplate.opsForValue().setIfAbsent(key, token, ADMISSION_TTL_SECONDS, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(wasSet)) {
            return token;
        }
        return redisTemplate.opsForValue().get(key);
    }

    // 예약 API(BookingController)가 특가 구매를 처리하기 전에 호출해 입장 토큰을 검증한다.
    public boolean isValidToken(String dealId, String userEmail, String token) {
        if (token == null) {
            return false;
        }
        String stored = redisTemplate.opsForValue().get(tokenKey(dealId, userEmail));
        return stored != null && stored.equals(token);
    }

    // 구매 완료/포기 시 슬롯을 즉시 반납 (호출 안 해도 TTL로 자동 회수됨)
    public void release(String dealId, String userEmail) {
        redisTemplate.opsForZSet().remove(admittedKey(dealId), userEmail);
        redisTemplate.delete(tokenKey(dealId, userEmail));
    }

    @SuppressWarnings("unchecked")
    private void promoteIfCapacityAvailable(String dealId) {
        long now = System.currentTimeMillis();
        long expiresAt = now + ADMISSION_TTL_SECONDS * 1000;

        List<String> promoted = redisTemplate.execute(
                PROMOTE_SCRIPT,
                List.of(admittedKey(dealId), waitingKey(dealId)),
                String.valueOf(CAPACITY), String.valueOf(now), String.valueOf(expiresAt)
        );

        if (promoted == null || promoted.isEmpty()) {
            return;
        }
        // 승격 자체(정원 확인 + 대기열 이동)는 이미 Lua로 원자적으로 끝났음.
        // 토큰 발급은 승격된 사람한테만 개별적으로 하면 되는 거라 원자성이 필요 없음.
        for (String userEmail : promoted) {
            getOrCreateToken(dealId, userEmail);
        }
    }

    private String waitingKey(String dealId) {
        return WAITING_KEY_PREFIX + dealId;
    }

    private String admittedKey(String dealId) {
        return ADMITTED_KEY_PREFIX + dealId;
    }

    private String tokenKey(String dealId, String userEmail) {
        return TOKEN_KEY_PREFIX + dealId + ":" + userEmail;
    }
}
