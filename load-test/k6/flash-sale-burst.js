// 시나리오: 특가 오픈 선착순 버스트
//
// "매일 오전 10시, 재고 20~30개짜리 특가에 평시(100명) 대비 10배(1,000명)가
//  거의 동시에 구매를 시도한다" 상황을 재현한다.
//
// 검증 목표:
//   1) 오버셀이 0건인가 (성공 건수 === 재고 수량)
//   2) 실제 시스템 장애(5xx/타임아웃) 비율이 SLO(1% 미만)를 넘지 않는가
//   3) 응답 지연이 SLO(p95 200ms)를 넘지 않는가
//
// 중요: 재고 소진(409)은 선착순 시스템에서 "의도된 정상 동작"이지 장애가 아니다.
// k6 기본 지표(http_req_failed)는 비2xx를 전부 실패로 집계해서 이 케이스에 안 맞기 때문에,
// 아래에서 성공/매진/진짜에러를 커스텀 메트릭으로 분리해서 판단한다.
//
// 사전 준비:
//   - docker compose up -d (Postgres, Redis, Observability 전체)
//   - 3개 백엔드 서비스 기동 (user/search/event-service)
//   - k6 설치: brew install k6
//
// 실행:
//   k6 run load-test/k6/flash-sale-burst.js
//   k6 run -e DEAL_ID=seaside-jeju load-test/k6/flash-sale-burst.js   # 다른 딜로 테스트
//
// 재실행 전 재고 리셋 (전체 DB를 밀지 않고 Redis 잔여 수량만 복구):
//   docker exec hotel-redis redis-cli SET event:stock:urban-seoul 30
//   docker exec hotel-redis redis-cli SET event:stock:seaside-jeju 20

import http from "k6/http"
import { check } from "k6"
import { Counter, Rate } from "k6/metrics"

const USER_SERVICE = __ENV.USER_SERVICE_URL || "http://localhost:8083"
const SEARCH_SERVICE = __ENV.SEARCH_SERVICE_URL || "http://localhost:8085"
const EVENT_SERVICE = __ENV.EVENT_SERVICE_URL || "http://localhost:8084"
const DEAL_ID = __ENV.DEAL_ID || "urban-seoul" // 기본: 재고 30개짜리 특가

const VU_COUNT = 1000 // 평시 100명의 10배 버스트 가정
const SIGNUP_BATCH_SIZE = 50 // 회원가입 시 bcrypt 해싱 부하를 나눠서 처리하기 위한 배치 크기

// 성공/매진/진짜에러를 구분해서 집계하는 커스텀 메트릭
const bookingSuccess = new Counter("booking_success")
const bookingSoldOut = new Counter("booking_sold_out")
const bookingUnexpectedError = new Rate("booking_unexpected_error")

export const options = {
  scenarios: {
    flash_sale_burst: {
      executor: "per-vu-iterations",
      vus: VU_COUNT,
      iterations: 1, // 가상 유저 1명당 "오픈 순간 딱 한 번" 구매 시도
      maxDuration: "30s",
    },
  },
  thresholds: {
    // 팀 SLO(feat/alertmanager에 정의된 값)를 그대로 통과 기준으로 사용
    http_req_duration: ["p(95)<200"], // p95 응답시간 200ms 미만
    booking_unexpected_error: ["rate<0.01"], // 5xx/타임아웃 등 진짜 에러 1% 미만
  },
}

// setup()은 부하 측정 전에 딱 한 번만 실행됨 — 여기서 걸리는 시간은 결과에 안 잡힘.
// 1,000명의 "실제 유저"를 미리 회원가입 + 로그인시켜서 쿠키를 확보해둔다.
// (재고 확인 API는 인당 구매 1회 제한이 있어서, 유저가 겹치면 오버셀 검증 자체가 왜곡됨)
export function setup() {
  const hotelRes = http.get(`${SEARCH_SERVICE}/api/v1/hotels/${DEAL_ID}`)
  if (hotelRes.status !== 200) {
    throw new Error(
      `대상 딜(${DEAL_ID}) 조회 실패 — search-service가 떠 있는지, 딜 ID가 맞는지 확인하세요.`,
    )
  }
  const basePrice = hotelRes.json("basePrice")

  const emails = []
  for (let i = 0; i < VU_COUNT; i++) {
    emails.push(`k6user_${i}_${Date.now()}@loadtest.com`)
  }

  // 1) 회원가입 — 배치로 나눠서 병렬 요청 (bcrypt 해싱이 CPU를 많이 써서 한 번에 1000개는 부담)
  for (let i = 0; i < VU_COUNT; i += SIGNUP_BATCH_SIZE) {
    const batch = emails
      .slice(i, i + SIGNUP_BATCH_SIZE)
      .map((email, idx) => [
        "POST",
        `${USER_SERVICE}/api/v1/users/signup`,
        JSON.stringify({ email, password: "loadtest1234!", name: `k6user${i + idx}` }),
        { headers: { "Content-Type": "application/json" } },
      ])
    http.batch(batch)
  }

  // 2) 로그인 — 각 유저의 쿠키(access_token)를 확보
  const cookies = []
  for (let i = 0; i < VU_COUNT; i += SIGNUP_BATCH_SIZE) {
    const batch = emails
      .slice(i, i + SIGNUP_BATCH_SIZE)
      .map((email) => [
        "POST",
        `${USER_SERVICE}/api/v1/users/login`,
        JSON.stringify({ email, password: "loadtest1234!" }),
        { headers: { "Content-Type": "application/json" } },
      ])
    const responses = http.batch(batch)
    responses.forEach((res) => {
      const token = res.cookies["access_token"] ? res.cookies["access_token"][0].value : null
      cookies.push(token ? `access_token=${token}` : "")
    })
  }

  return { basePrice, cookies }
}

// 각 가상 유저(VU)가 실행하는 실제 부하 — "특가 구매 버튼 클릭 한 번"
export default function (data) {
  const cookie = data.cookies[__VU - 1]

  const payload = JSON.stringify({
    hotelId: DEAL_ID,
    hotelName: DEAL_ID,
    roomType: "기본룸",
    checkIn: "2026-08-01",
    checkOut: "2026-08-02",
    nights: 1,
    guests: 2,
    totalPrice: data.basePrice, // 특가는 nights/guests와 무관하게 basePrice 그대로
    eventDeal: true,
  })

  const res = http.post(`${EVENT_SERVICE}/api/v1/bookings`, payload, {
    headers: { "Content-Type": "application/json", Cookie: cookie },
  })

  const isSuccess = res.status === 201
  const isSoldOut = res.status === 409 // "선착순 마감되었습니다" — 정상 동작
  const isUnexpected = !isSuccess && !isSoldOut // 5xx, 400, 타임아웃 등 — 진짜 문제

  check(res, {
    "201(구매 성공) 또는 409(정상 매진) 중 하나": () => isSuccess || isSoldOut,
  })

  if (isSuccess) bookingSuccess.add(1)
  if (isSoldOut) bookingSoldOut.add(1)
  bookingUnexpectedError.add(isUnexpected)
}

// 테스트 종료 후 안내만 출력 (실제 오버셀 검증은 아래 curl로 별도 확인 권장)
export function teardown() {
  console.log(
    `검증: curl http://localhost:8084/api/v1/events/${DEAL_ID} 로 remaining=0, soldOut=true 인지 확인하세요.`,
  )
  console.log(
    `      booking_success 카운트가 재고 수량(예: urban-seoul=30)과 정확히 일치해야 오버셀 0건입니다.`,
  )
}
