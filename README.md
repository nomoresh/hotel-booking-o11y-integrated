# 🏨 Hotel Booking & Observability Integrated System
> 
> **주제:** 대규모 특가 트래픽 대응을 위한 마이크로서비스 아키텍처(MSA) 및 Observability 3축(메트릭·로그·트레이싱) 통합 관찰 시스템 구축

---

## 🚀 1. 프로젝트 개요 (Introduction)
본 프로젝트는 호텔 예약 서비스에서 **"특가 이벤트"** 시 발생하는 순간적인 대규모 트래픽(Momental Traffic) 상황을 가정합니다. 클라우드 네이티브 환경에서 이러한 급격한 부하와 인프라 장애 발생 시, 시스템의 신뢰성을 보장하기 위해 **메트릭(Metric), 로그(Log), 추적(Trace)**의 3축 데이터를 단일 화면에서 유기적으로 상관 분석할 수 있는 통합 Observability 아키텍처를 구현합니다.

> 📌 현재는 MSA 기반 예약 플로우(회원가입/로그인, 호텔 조회, 선착순 특가 예약)까지 로컬 환경에서 동작을 완료한 단계이며, Observability 스택과 인프라 자동화는 다음 단계로 진행 중입니다. 자세한 현황은 [5. 구현 현황]을 참고하세요.

### ✨ 핵심 차별화 포인트
- **통합 관찰성 (Unified O11y):** Grafana를 중심으로 메트릭 조회 중 특정 에러 로그를 확인하고, 해당 로그의 `traceId`를 통해 분산 추적(Tempo)으로 즉시 점프하는 단일 화면 분석 체계 구축.
- **실전형 부하 시뮬레이션:** K6를 활용하여 특가 오픈 시점의 피크 트래픽을 재현하고, 임베디드 카오스 시나리오(Pod Eviction, CPU Throttle)를 통해 알림 및 복구 메커니즘 검증.
- **자동화된 장애 대응:** 프로메테우스 Alertmanager 알림 메시지에 실시간 대시보드 링크와 구체적인 조치 절차가 담긴 **런북(Runbook)**을 포함하여 MTTR(평균 복구 시간) 최소화.

---

## 👥 2. 팀원 소개 및 역할 분배 (Team & Roles)

| 이름 | 역할 | 담당 업무 (R&B) |
| :--- | :--- | :--- |
| **김준우(팀장)** | **인프라 & CI/CD** | • Kubernetes 클러스터 환경 구성 및 자원 관리<br>• GitHub Actions + ArgoCD 기반 GitOps 배포 파이프라인 구축<br>• 애플리케이션 Helm 차트 작성 및 배포 자동화 |
| **임수정** | **MSA 개발 & 트레이싱** | • Next.js 프론트엔드 UI/UX 반영 및 API 연동<br>• 핵심 마이크로서비스 3종 개발 및 OpenTelemetry SDK 내장<br>• K6 기반 부하 테스트 스크립트 작성 및 트래픽 유발 |
| **하종연** | **Observability 스택** | • LGTM(Loki, Grafana, Tempo, Mimir) 관찰성 스택 구축<br>• 4 Golden Signals 기반 그라파나 대시보드 설계<br>• Alertmanager 알림 규칙 설정 및 Slack 웹훅 연동 |

---

## 🛠️ 3. 기술 스택 (Tech Stack)

### [ 인프라 및 오케스트레이션 ]
- **정렬/관리:** Kubernetes (EKS 또는 Local cluster)
- **패키지 관리:** Helm
- **배포 자동화:** GitHub Actions / ArgoCD (GitOps)

### [ 애플리케이션 및 데이터베이스 (MSA) ]
- **프론트엔드:** 웹 인터페이스 애플리케이션 (Next.js / Tailwind CSS)
- **백엔드 서비스:** Spring Boot (Java) 또는 FastAPI (Python)
- **데이터 저장소:** PostgreSQL (메인 DB) / Redis (특가 캐싱 및 분산 락 관리)

### [ 관찰성 통합 및 성능 검증 (Observability & Test) ]
- **메트릭 (Metric):** Prometheus / Grafana Mimir
- **로그 (Log):** Grafana Loki / Promtail (또는 Fluent Bit)
- **분산 추적 (Trace):** OpenTelemetry SDK & Collector / Grafana Tempo
- **시각화 및 알림:** Grafana / Prometheus Alertmanager / Slack Webhook
- **부하 테스트:** K6 (또는 Locust)

---

## 🏗️ 4. 시스템 아키텍처 (System Architecture)

### 🧩 [1] 마이크로서비스 구조 (MSA Components)
서비스는 느슨한 결합(Loose Coupling) 구조로 설계되어 대규모 트래픽 인입 시 예약 시스템의 부하가 검색 인프라에 영향을 주지 않도록 격리했습니다.
- **`hotel-frontend` (Next.js):** 특가 상품 노출 및 실시간 예약 대시보드 UI. *(포트 3000)*
- **`user-service`:** 회원가입/로그인/로그아웃. BCrypt 비밀번호 해싱, JWT를 HttpOnly 쿠키로 발급. *(포트 8083)*
- **`search-service`:** 호텔 및 리조트 정보 조회. 지역/키워드/가격대/평점 조건별 검색과 정렬을 지원하며, 검색 결과는 Caffeine 기반 인메모리 캐시(TTL 5분)로 응답. 프론트 `/search` 페이지가 실제로 이 API를 호출하며, 응답받은 `id`를 프론트의 정적 호텔 데이터(이미지·태그 등 상세 정보)와 매칭해 화면을 구성함. *(포트 8085)*
- **`event-service`:** 예약 생성/조회/취소 및 특가 선착순 재고 관리. Redis 원자 연산(Lua 스크립트)으로 재고 초과 판매 방지, 인당 구매 개수 제한. 예약 생성 시 search-service를 호출해 결제 금액을 서버가 직접 재계산·검증(클라이언트 조작 방지, search-service 장애 시 503). 예약 취소는 일반 예약만 체크인 하루 전까지 가능하며 특가 상품은 취소 불가. *(포트 8084)*
- **`notice-service`:** 예약 완료 후 비동기로 알림 전송 (분산 추적 컨텍스트 전파 검증용). *(계획 단계, 메시지 큐 선정부터 필요 — 아직 미착수)*

### 📊 [2] Observability 통합 흐름 (O11y Pipeline)
[ App Pods ] ──(Metrics)──────> [ Prometheus ] ──────> [ Grafana Mimir ] ──┐
──(Structured Log)─> [ Promtail ] ────────> [ Grafana Loki ]  ──┼─> [ Grafana UI ]
──(Traces Context)─> [ Otel Collector ] ──> [ Grafana Tempo ] ──┘

> **메트릭(1/3축) 완료.** 3개 서비스 모두 Micrometer + `micrometer-registry-prometheus`로 `/actuator/prometheus`를 노출하고,
> 로컬 Prometheus가 15초 주기로 스크래핑, Grafana가 자동 프로비저닝된 대시보드(`observability/grafana/dashboards/msa-golden-signals.json`)로
> 요청 처리량 · 에러율 · p95 지연시간 · JVM 힙 사용량을 보여줌. 로그(Loki)·트레이싱(Tempo)은 아직 미착수 — 5. 구현 현황 참고.

---

## ✅ 5. 구현 현황 (Implementation Status)

전체 목표 대비 현재 어디까지 되어 있는지를 정리한 표입니다. (최종 갱신: 2026-07-06)

| 영역 | 항목 | 상태 |
| :--- | :--- | :--- |
| **인증** | 회원가입 / 로그인 / 로그아웃 (BCrypt, JWT HttpOnly 쿠키) | ✅ 완료 |
| **인증** | 서비스 간 인증 공유 (event-service가 동일 시크릿으로 쿠키 검증) | ✅ 완료 |
| **검색** | 호텔 목록/상세 조회 (Postgres 기반) | ✅ 완료 |
| **검색** | 조건별 검색/필터(지역·키워드·가격대·평점), 정렬 | ✅ 완료 |
| **검색** | 인메모리 캐싱 (Caffeine, TTL 5분, 동시 요청 stampede 방지) | ✅ 완료 |
| **검색** | 프론트 `/search` 페이지 실제 API 연동 (키워드 검색 + 정렬) | ✅ 완료 |
| **예약** | 예약 생성 / 내 예약 조회 | ✅ 완료 |
| **예약** | 선착순 재고 관리 (Redis 원자 연산, 오버셀 방지, 인당 구매 제한) | ✅ 완료 |
| **예약** | 예약 취소 (일반 예약만, 체크인 하루 전까지) + 마이페이지 취소 버튼 연동 | ✅ 완료 |
| **예약** | 결제 금액 서버 측 검증 (search-service 실호출로 재계산) | ✅ 완료 |
| **인프라** | 로컬 Docker Compose (Postgres + Redis + Prometheus + Grafana) | ✅ 완료 |
| **인프라** | K8s 매니페스트 / Helm / ArgoCD GitOps | ⬜ 미착수 |
| **인프라** | CI/CD (GitHub Actions) | ⬜ 미착수 |
| **Observability** | 메트릭 (Micrometer + Prometheus, 3개 서비스 전체) | ✅ 완료 |
| **Observability** | Grafana 대시보드 (요청량·에러율·p95·JVM 힙, 자동 프로비저닝) | ✅ 완료 |
| **Observability** | 로그 (Loki) | ⬜ 미착수 |
| **Observability** | 분산 추적 (OpenTelemetry + Tempo) | ⬜ 미착수 |
| **Observability** | Alertmanager 런북 | ⬜ 미착수 |
| **알림** | notice-service (비동기 알림, 트레이스 전파 검증) | ⬜ 미착수 — 메시지 큐 선정부터 필요 |
| **부하 테스트** | K6 시나리오 | ⬜ 미착수 |

> 로컬에서 회원가입 → 로그인 → 호텔 검색(키워드/정렬) → 특가 예약(재고 차감 포함) → 마이페이지까지 전 구간을 브라우저에서 실제로 실행/검증했고, 3개 서비스의 메트릭이 Grafana 대시보드로 실시간 확인됩니다. 다음 단계는 로그(Loki)·분산 추적(Tempo)입니다.

---

## 📂 6. 프로젝트 디렉토리 구조 (Repository Structure)

```text
hotel-booking-o11y-integrated/
├── apps/                         # 마이크로서비스 애플리케이션 소스 코드
│   ├── hotel-frontend/           # Next.js 프론트엔드 웹 앱 (포트 3000)
│   ├── user-service/             # 회원가입/로그인/로그아웃 (포트 8083)
│   ├── event-service/            # 예약 생성/조회, 선착순 재고 관리 (포트 8084)
│   └── search-service/           # 호텔 조회 서비스 (포트 8085)
├── observability/                # 관찰성 인프라 설정 (메트릭만 구현, 로그·트레이싱은 예정)
│   ├── prometheus/prometheus.yml         # 3개 서비스 스크래핑 설정
│   └── grafana/
│       ├── provisioning/                 # 데이터소스·대시보드 자동 등록
│       └── dashboards/msa-golden-signals.json
└── docker-compose.yml            # 로컬 개발용 Postgres + Redis + Prometheus + Grafana

```

> `infra/`(K8s·Helm), `load-test/`(K6), `notice-service/`는 아직 만들어지지 않았습니다. `observability/`는 메트릭 부분만 구현되어 있고 로그(Loki)·트레이싱(Tempo) 설정은 이후 추가될 예정입니다.

## 📊 7. 핵심 모니터링 및 알림 설계 (SLO & Alerts)
```text
        지표 (SLI)    |     목표 (SLO)   |                측정 방식 / 임계치
가용성 (Availability)       99.5%               최근 30일간 HTTP 5XX 에러 비율 전체 요청의 0.5% 미만 유지
지연 시간 (Latency)          p95 < 200ms             특가 예약 API 요청의 95%가 200ms 이내에 응답 완료
에러율 (Error Rate)         < 1.0%             Peak Time 시 시스템 예외(Exception) 발생 빈도 1% 미만 제어

```
> Grafana 대시보드(요청량·에러율·p95)로 위 지표를 실시간으로 볼 수 있게 됐지만, 임계치를 넘었을 때 자동으로 알리는 Alertmanager 규칙은 아직 없습니다 (수동 확인만 가능).

## 💻 8. 시작 가이드 (Quick Start)
Prerequisites
- Node.js v20+ 및 npm
- Java 21, Gradle
- Docker Desktop (Postgres·Redis·Prometheus·Grafana 컨테이너 실행용)

1) 인프라 기동 (Postgres 5433, Redis 6379, Prometheus 9090, Grafana 3001)
```bash
docker compose up -d
```

2) 백엔드 3개 서비스 실행 (각각 다른 터미널에서)
```bash
cd apps/user-service && ./gradlew bootRun     # http://localhost:8083
cd apps/event-service && ./gradlew bootRun    # http://localhost:8084
cd apps/search-service && ./gradlew bootRun   # http://localhost:8085
```

3) 프론트엔드 실행
```bash
cd apps/hotel-frontend
npm install
npm run dev
```
브라우저에서 http://localhost:3000으로 접속하여 회원가입 → 로그인 → 호텔 조회 → 예약까지 확인할 수 있습니다.

4) 모니터링 대시보드 확인
http://localhost:3001 (Grafana, 계정 admin/admin) 접속 → **MSA Golden Signals** 대시보드에서 3개 서비스의 요청량·에러율·p95 지연시간·JVM 힙 사용량 확인. Prometheus 자체 UI는 http://localhost:9090/targets 에서 스크래핑 상태 확인 가능.
