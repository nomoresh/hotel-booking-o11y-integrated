# 🏨 Hotel Booking & Observability Integrated System
> 
> **주제:** 대규모 특가 트래픽 대응을 위한 마이크로서비스 아키텍처(MSA) 및 Observability 3축(메트릭·로그·트레이싱) 통합 관찰 시스템 구축

---

## 🚀 1. 프로젝트 개요 (Introduction)
본 프로젝트는 호텔 및 항공권 예약 서비스에서 **"특가 이벤트"** 시 발생하는 순간적인 대규모 트래픽(Momental Traffic) 상황을 가정합니다. 클라우드 네이티브 환경에서 이러한 급격한 부하와 인프라 장애 발생 시, 시스템의 신뢰성을 보장하기 위해 **메트릭(Metric), 로그(Log), 추적(Trace)**의 3축 데이터를 단일 화면에서 유기적으로 상관 분석할 수 있는 통합 Observability 아키텍처를 구현했습니다.

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
- **`hotel-frontend` (Next.js):** v0 기반으로 고도화된 특가 상품 노출 및 실시간 예약 대시보드 UI.
- **`search-service`:** 전체 호텔 및 리조트 정보 조회를 담당하며, 트래픽 분산을 위해 인메모리 캐싱 적용.
- **`event-service`:** 실시간 특가 항공권/숙소 선착순 예약 처리. Redis를 이용한 분산 락 및 대기열 검증 구조.
- **`notice-service`:** 예약 완료 후 비동기로 알림 전송 (분산 추적 컨텍스트 전파 검증용).

### 📊 [2] Observability 통합 흐름 (O11y Pipeline)
[ App Pods ] ──(Metrics)──────> [ Prometheus ] ──────> [ Grafana Mimir ] ──┐
──(Structured Log)─> [ Promtail ] ────────> [ Grafana Loki ]  ──┼─> [ Grafana UI ]
──(Traces Context)─> [ Otel Collector ] ──> [ Grafana Tempo ] ──┘

---

## 📂 5. 프로젝트 디렉토리 구조 (Repository Structure)

```text
hotel-booking-o11y-integrated/
├── apps/                         # 마이크로서비스 애플리케이션 소스 코드
│   ├── hotel-frontend/           # v0 활용 Next.js 프론트엔드 웹 앱
│   ├── search-service/           # 호텔 조회 서비스
│   └── event-service/            # 특가 선착순 예약 서비스
├── infra/                        # 인프라 프로비저닝 및 K8s 매니페스트
│   ├── k8s-manifests/            # 서비스별 Deployment, Service, ConfigMap YAML
│   └── helm/                     # 환경 구축 자동화를 위한 Helm 차트
├── observability/                # 관찰성 인프라 설정 및 대시보드 코드
│   ├── grafana-dashboards/       # 4 Golden Signals 대시보드 JSON 템플릿
│   └── alertmanager/             # 임계값 알림 규칙 정의서 (alert.rules.yml)
└── load-test/                    # 부하 및 카오스 엔지니어링 스크립트
    └── k6-hotdeal-scenario.js    # 특가 이벤트 가상 시나리오 스크립트

```

## 📊 6. 핵심 모니터링 및 알림 설계 (SLO & Alerts)
```text
        지표 (SLI)    |     목표 (SLO)   |                측정 방식 / 임계치
가용성 (Availability)     99.5%               최근 30일간 HTTP 5XX 에러 비율 전체 요청의 0.5% 미만 유지
지연 시간 (Latency)        p95 < 200ms             특가 예약 API 요청의 95%가 200ms 이내에 응답 완료
에러율 (Error Rate)       < 1.0%             Peak Time 시 시스템 예외(Exception) 발생 빈도 1% 미만 제어

```

## 💻 7. 시작 가이드 (Quick Start)
Prerequisites
- Node.js v20+ 및 npm
- Docker Desktop & Kubernetes 클러스터 환경 (kubectl 활성화 필수)


1) 프론트엔드 로컬 실행 방법
```bash
cd apps/hotel-frontend
npm install
npm run dev
```
브라우저에서 http://localhost:3000으로 접속하여 인터페이스를 확인합니다.


2) 인프라 및 애플리케이션 K8s 배포 방법
```bash
# 매니페스트 배포 예시
kubectl apply -f infra/k8s-manifests/

# 관찰성 가동 확인
kubectl get pods -n observability
```
