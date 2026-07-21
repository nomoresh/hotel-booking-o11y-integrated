package com.hotel.event_service.controller.dto;

// 대기열 상태 응답. state가 "ADMITTED"일 때만 admissionToken이 채워짐.
public record QueueStatus(
        String state, // WAITING | ADMITTED | NOT_IN_QUEUE
        Long position,
        Long totalWaiting,
        Long estimatedSeconds,
        String admissionToken
) {
    public static QueueStatus admitted(String token) {
        return new QueueStatus("ADMITTED", null, null, null, token);
    }

    public static QueueStatus waiting(long position, long totalWaiting, long estimatedSeconds) {
        return new QueueStatus("WAITING", position, totalWaiting, estimatedSeconds, null);
    }

    public static QueueStatus notInQueue() {
        return new QueueStatus("NOT_IN_QUEUE", null, null, null, null);
    }
}
