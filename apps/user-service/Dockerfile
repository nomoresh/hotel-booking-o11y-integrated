# 1단계: 빌드 스테이지 (Gradle 빌드 수행)
FROM gradle:8.8-jdk21 AS builder
WORKDIR /build

# 빌드 속도 향상을 위해 의존성 캐싱 유도
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN ./gradlew build -x test --no-daemon || true

# 실제 소스 코드 복사 및 빌드
COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# 2단계: 실행 스테이지 (최종 경량화 이미지 생성)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# 빌드 스테이지에서 생성된 최적화 jar 파일만 쏙 빼오기
COPY --from=builder /build/build/libs/*.jar app.jar

# 인프라 환경에서 덤프 및 타임존 설정을 위한 환경 변수
ENV TZ=Asia/Seoul

# 컨테이너 실행 명령어
ENTRYPOINT ["java", "-jar", "-Duser.timezone=Asia/Seoul", "app.jar"]