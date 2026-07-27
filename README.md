# 🏨 Hotel Booking & Observability Integrated System
> 
> **주제:** 대규모 특가 트래픽 대응을 위한 마이크로서비스 아키텍처(MSA) 및 Observability 3축(메트릭·로그·트레이싱) 통합 관찰 시스템 구축

---

## 🚀 1. 프로젝트 개요 (Introduction)
본 프로젝트는 호텔 예약 서비스에서 **"특가 이벤트"** 시 발생하는 순간적인 대규모 트래픽(Momental Traffic) 상황을 가정합니다. 클라우드 네이티브 환경에서 이러한 급격한 부하와 인프라 장애 발생 시, 시스템의 신뢰성을 보장하기 위해 **메트릭(Metric), 로그(Log), 추적(Trace)**의 3축 데이터를 단일 화면에서 유기적으로 상관 분석할 수 있는 통합 Observability 아키텍처를 구현합니다.


### ✨ 핵심 차별화 포인트
- **통합 관찰성 (Unified O11y):** Grafana를 중심으로 메트릭 조회 중 특정 에러 로그를 확인하고, 해당 로그의 `traceId`를 통해 분산 추적(Tempo)으로 즉시 점프하는 단일 화면 분석 체계 구축. **(✅ 구현 완료 — 5. 구현 현황 참고)**
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
- **`event-service`:** 예약 생성/조회/취소 및 특가 선착순 재고 관리. Redis 원자 연산(Lua 스크립트)으로 재고 초과 판매 방지, 인당 구매 개수 제한. 예약 생성 시 search-service를 호출해 결제 금액을 서버가 직접 재계산·검증(클라이언트 조작 방지, search-service 장애 시 503) — 이 호출은 분산 트레이싱으로 두 서비스가 하나의 트레이스에 묶여 추적됨. 예약 취소는 일반 예약만 체크인 하루 전까지 가능하며 특가 상품은 취소 불가. 특가 구매는 대기열(Redis Sorted Set + Lua 원자 승격)을 통과해 발급받은 입장 토큰을 서버가 검증해야만 처리되며, 대기열 UI를 건너뛰고 API를 직접 호출하는 것은 차단됨. 구매 성공뿐 아니라 매진/중복구매/저장실패로 끝나도 대기열 슬롯을 즉시 반납해 뒷사람이 바로 승격되며, 토큰 발급은 동시 요청에도 하나의 값으로 수렴하도록 원자적으로 처리됨(K6 1,000 동시접속 부하테스트로 검증). *(포트 8084)*
- **`notice-service`:** 예약 완료 직후 Redis Streams(`booking-notifications`)로 비동기 알림 발행/소비. 컨슈머가 잠시 내려가 있어도 메시지가 스트림에 남아 재시작 후 이어받음(at-least-once). HTTP 호출과 달리 자동 계측이 없는 구간이라 발행 시 트레이스 컨텍스트를 수동으로 주입하고 소비 시 추출해 하나의 트레이스로 이어지도록 구현. *(포트 8086)*

### 📊 [2] Observability 통합 흐름 (O11y Pipeline)
[ App Pods ] ──(Metrics)──────> [ Prometheus ] ──────> [ Grafana ] ──┐
──(Structured Log)─> [ Logback → Loki 직접 push ] ──────┼─> [ Grafana UI ]
──(Traces Context)─> [ Micrometer Tracing → OTLP ] ──> [ Tempo ] ──┘

> **메트릭·로그·트레이싱(3/3축) 완료 — 로컬 + 실제 EKS `dev` 클러스터 양쪽에서 동작.** 4개 서비스 모두 Micrometer + `micrometer-registry-prometheus`로 `/actuator/prometheus`를 노출하고,
> Prometheus가 15초 주기로 스크래핑. 로그는 Promtail 없이 Logback(`loki-logback-appender`)이 Loki로 직접 push (서비스가
> 컨테이너가 아니라 호스트에서 떠 있어 파일 tail 방식보다 이 방식이 단순함). 분산 추적은 Micrometer Tracing(OTel 브릿지)이 OTLP로
> Tempo에 직접 push — event-service가 결제 금액 검증을 위해 search-service를 호출하는 구간, 그리고 notice-service가 Redis Streams로
> 비동기 알림을 처리하는 구간(수동 트레이스 컨텍스트 전파)까지 하나의 트레이스로 묶이는 것을 로컬에서 확인함. 로그 본문에 `trace_id`를
> 노출해 Grafana에서 로그 ↔ 트레이스 양방향 점프가 가능함. Grafana가 자동 프로비저닝된 대시보드(`observability/grafana/dashboards/msa-golden-signals.json`)로
> 요청 처리량 · 에러율 · p95 지연시간 · JVM 힙 사용량 · 최근 로그를 한 화면에서 보여줌.
>
> **클러스터 배포:** `monitoring` 네임스페이스에 `kube-prometheus-stack`(Prometheus+Grafana+Alertmanager), `loki`, `tempo`를 각각 Helm으로 설치.
> `dev` 네임스페이스의 4개 서비스는 `ServiceMonitor`로 자동 스크래핑되고, Loki push 주소/OTLP 엔드포인트는 `LOKI_PUSH_URL` /
> `OTLP_TRACING_ENDPOINT` 환경변수로 주입(로컬 실행 시 기본값은 `localhost`라 로컬 개발엔 영향 없음). 로그·트레이스 저장은
> `aws-ebs-csi-driver` 기반 EBS PVC(gp2, 5Gi)로 영구 저장되어 파드가 재시작돼도 유실되지 않음. Alertmanager는 Slack Webhook과
> 연동되어 SLO 위반 시 채널로 실시간 알림을 보냄(웹훅 값은 `slack_api_url_file` 패턴으로 git에 남기지 않고 클러스터 Secret으로만 주입).
> 관련 설정은 `observability/k8s/`에 있음.
>
> **알려진 이슈(클러스터 한정, 조사 중):** event/user/search-service 파드가 재배포 이후 Loki로 로그를 전송하지 못하는 현상과,
> event-service의 예약 생성(POST) 요청 트레이스가 Tempo에 기록되지 않는 현상이 있음(로컬에서는 재현되지 않음, notice-service는 정상).
> 원인 조사 중이며 로그/트레이스 파이프라인 자체는 로컬 환경에서 3축 모두 정상 동작이 검증되어 있음.

---

## ✅ 5. 구현 현황 (Implementation Status)

전체 목표 대비 현재 어디까지 되어 있는지를 정리한 표입니다. (최종 갱신: 2026-07-27)

| 영역 | 항목 | 상태 |
| :--- | :--- | :--- |
| **인증** | 회원가입 / 로그인 / 로그아웃 (BCrypt, JWT HttpOnly 쿠키) | ✅ 완료 |
| **인증** | 서비스 간 인증 공유 (event-service가 동일 시크릿으로 쿠키 검증) | ✅ 완료 |
| **인증** | 쿠키 `Secure` 플래그 환경별 설정 (HTTP만 여는 ALB 대응, 환경변수로 제어) | ✅ 완료 |
| **검색** | 호텔 목록/상세 조회 (Postgres 기반) | ✅ 완료 |
| **검색** | 조건별 검색/필터(지역·키워드·가격대·평점), 정렬 | ✅ 완료 |
| **검색** | 인메모리 캐싱 (Caffeine, TTL 5분, 동시 요청 stampede 방지) | ✅ 완료 |
| **검색** | 프론트 `/search` 페이지 실제 API 연동 (키워드 검색 + 정렬) | ✅ 완료 |
| **예약** | 예약 생성 / 내 예약 조회 | ✅ 완료 |
| **예약** | 선착순 재고 관리 (Redis 원자 연산, 오버셀 방지, 인당 구매 제한) | ✅ 완료 |
| **예약** | 예약 취소 (일반 예약만, 체크인 하루 전까지) + 마이페이지 취소 버튼 연동 | ✅ 완료 |
| **예약** | 결제 금액 서버 측 검증 (search-service 실호출로 재계산) | ✅ 완료 |
| **예약** | 대기열 시스템 (Redis Sorted Set + Lua 원자 승격, 선착순 특가 트래픽 완충) | ✅ 완료 |
| **예약** | 대기열 ↔ 예약 API 강제 연동 (입장 토큰 검증, 매진/실패 시에도 슬롯 즉시 반납, 토큰 발급 원자성 보장) | ✅ 완료, K6 1,000 VU로 동시성 검증 |
| **인프라** | 로컬 Docker Compose (Postgres + Redis + Prometheus + Grafana + Loki + Tempo) | ✅ 완료 |
| **인프라** | K8s 매니페스트 / Helm / ArgoCD GitOps (EKS `dev`/`prod`) | ✅ 완료 |
| **인프라** | CI/CD (GitHub Actions, 서비스별 변경 감지 빌드 + ECR push + Trivy 스캔) | ✅ 완료 |
| **Observability** | 메트릭 (Micrometer + Prometheus, 4개 서비스 전체) | ✅ 완료 |
| **Observability** | Grafana 대시보드 (요청량·에러율·p95·JVM 힙·로그, 자동 프로비저닝) | ✅ 완료 |
| **Observability** | 로그 (Loki, Logback → 직접 push) | ✅ 완료 (로컬), 🚧 클러스터에서 일부 서비스 로그 유실 조사 중 |
| **Observability** | 분산 추적 (Micrometer Tracing + OTel + Tempo, 서비스 간 전파 확인) | ✅ 완료 (로컬), 🚧 클러스터에서 예약 생성(POST) 트레이스 유실 조사 중 |
| **Observability** | 로그 ↔ 트레이스 상호 점프 (Grafana derivedFields / tracesToLogsV2) | ✅ 완료 |
| **Observability** | 클러스터(dev) 배포 (kube-prometheus-stack/Loki/Tempo + ServiceMonitor + EBS PVC 영구 저장) | ✅ 완료 |
| **Observability** | Alertmanager + Slack 알림 연동 | ✅ 완료, 클러스터 배포 및 실제 Slack 알림 도착까지 확인 |
| **알림** | notice-service (Redis Streams 기반 비동기 알림, 트레이스 전파 검증) | ✅ 완료, 로컬+클러스터 배포 검증 완료 |
| **부하 테스트** | K6 시나리오 (특가 오픈 피크 트래픽 재현, 대기열 연동 포함) | ✅ 완료, 1,000 VU에서 오버셀 0건 검증 |

> 로컬 + 실제 EKS 클러스터 양쪽에서 회원가입 → 로그인 → 호텔 검색(키워드/정렬) → 특가 예약(대기열 통과 → 입장 토큰 검증 → 재고 차감 → 비동기 알림 발송 포함) → 마이페이지까지 전 구간을 실제로 실행/검증했고, Observability 3축(메트릭·로그·트레이싱) 모두 Grafana 한 화면에서 실시간 확인됩니다. K6 1,000명 동시접속 부하테스트로 대기열 병목(슬롯 미반납, 토큰 발급 경쟁 상태)을 발견해 수정했고, 오버셀 0건·에러 0%까지 검증했습니다. 남은 이슈는 클러스터 한정 로그/트레이스 유실 원인 조사입니다.

---

## 📂 6. 프로젝트 디렉토리 구조 (Repository Structure)

```text
hotel-booking-o11y-integrated/
├── apps/                         # 마이크로서비스 애플리케이션 소스 코드
│   ├── hotel-frontend/           # Next.js 프론트엔드 웹 앱 (포트 3000)
│   ├── user-service/             # 회원가입/로그인/로그아웃 (포트 8083)
│   ├── event-service/            # 예약 생성/조회, 선착순 재고 관리, 대기열 (포트 8084)
│   ├── search-service/           # 호텔 조회 서비스 (포트 8085)
│   └── notice-service/           # 예약 완료 비동기 알림 (Redis Streams, 포트 8086)
├── observability/                # 관찰성 인프라 설정 (메트릭·로그·트레이싱 모두 구현, 로컬+클러스터)
│   ├── prometheus/
│   │   ├── prometheus.yml                # 로컬용 스크래핑 설정
│   │   └── rules/alerts.yml              # 로컬용 알림 규칙 (HighErrorRate, HighLatency, ServiceDown)
│   ├── loki/loki-config.yaml              # 로컬용 로그 저장소 설정 (filesystem, 단일 프로세스)
│   ├── tempo/tempo.yaml                   # 로컬용 트레이스 저장소 설정 (OTLP 수신, filesystem)
│   ├── grafana/
│   │   ├── provisioning/                 # 데이터소스(Prometheus·Loki·Tempo)·대시보드 자동 등록, 로그↔트레이스 연동
│   │   └── dashboards/msa-golden-signals.json
│   └── k8s/                              # EKS `dev` 클러스터용 Helm values / ServiceMonitor / ConfigMap
│       ├── kube-prometheus-stack-values.yaml   # Prometheus + Grafana + Alertmanager(Slack 연동)
│       ├── prometheus-rules.yaml               # 클러스터용 PrometheusRule CRD (알림 규칙)
│       ├── loki-values.yaml
│       ├── tempo-values.yaml
│       ├── app-service-monitor.yaml
│       ├── grafana-dashboard-configmap.yaml
│       └── grafana-datasources-configmap.yaml
├── charts/hotel/                 # 애플리케이션 배포용 Helm 차트 (ArgoCD가 values-dev.yaml/values-prod.yaml로 배포)
├── argocd/                       # ArgoCD Application 매니페스트 (dev는 joon 브랜치, prod는 main 브랜치 추적)
├── .github/workflows/            # GitHub Actions CI/CD (cicd-dev.yaml, cicd-prod.yaml)
├── load-test/k6/flash-sale-burst.js   # 특가 오픈 피크 트래픽 재현 K6 스크립트 (대기열 연동 포함)
└── docker-compose.yml            # 로컬 개발용 Postgres + Redis + Prometheus + Grafana + Loki + Tempo

```

> `observability/`는 메트릭·로그·트레이싱 3축 모두 로컬과 EKS `dev` 클러스터 양쪽에 구현되어 있습니다.

## 📊 7. 핵심 모니터링 및 알림 설계 (SLO & Alerts)
```text
        지표 (SLI)    |     목표 (SLO)   |                측정 방식 / 임계치
가용성 (Availability)       99.5%               최근 30일간 HTTP 5XX 에러 비율 전체 요청의 0.5% 미만 유지
지연 시간 (Latency)          p95 < 200ms             특가 예약 API 요청의 95%가 200ms 이내에 응답 완료
에러율 (Error Rate)         < 1.0%             Peak Time 시 시스템 예외(Exception) 발생 빈도 1% 미만 제어

```
> Grafana 대시보드(요청량·에러율·p95)로 위 지표를 실시간으로 볼 수 있고, 임계치를 넘으면 Prometheus Alertmanager가 Slack(`#hotel-alerts`)으로 실시간 알림을 보냅니다. EKS 관리형 컨트롤 플레인 특성상 kube-prometheus-stack 기본 알림 규칙 중 `KubeControllerManagerDown`/`KubeSchedulerDown`/`etcd` 관련 규칙은 우리 클러스터에서 항상 오탐(false positive)이 발생해 비활성화했습니다.

## 💻 8. 시작 가이드 (Quick Start)
Prerequisites
- Node.js v20+ 및 npm
- Java 21, Gradle
- Docker Desktop (Postgres·Redis·Prometheus·Grafana·Loki·Tempo 컨테이너 실행용)

1) 인프라 기동 (Postgres 5433, Redis 6379, Prometheus 9090, Loki 3100, Tempo 3200/4317/4318, Grafana 3001)
```bash
docker compose up -d
```

2) 백엔드 4개 서비스 실행 (각각 다른 터미널에서)
```bash
cd apps/user-service && ./gradlew bootRun     # http://localhost:8083
cd apps/event-service && ./gradlew bootRun    # http://localhost:8084
cd apps/search-service && ./gradlew bootRun   # http://localhost:8085
cd apps/notice-service && ./gradlew bootRun   # http://localhost:8086
```

3) 프론트엔드 실행
```bash
cd apps/hotel-frontend
npm install
npm run dev
```
브라우저에서 http://localhost:3000으로 접속하여 회원가입 → 로그인 → 호텔 조회 → 예약까지 확인할 수 있습니다.

4) 모니터링 대시보드 확인
http://localhost:3001 (Grafana, 계정 admin/admin) 접속 → **MSA Golden Signals** 대시보드에서 3개 서비스의 요청량·에러율·p95 지연시간·JVM 힙 사용량과 최근 로그를 한 화면에서 확인. Prometheus 자체 UI는 http://localhost:9090/targets, Loki·Tempo는 Grafana Explore 탭에서 조회 (`{app="event-service"}` 같은 LogQL, 또는 로그의 `trace_id=...` 클릭 시 해당 트레이스로 바로 이동).
