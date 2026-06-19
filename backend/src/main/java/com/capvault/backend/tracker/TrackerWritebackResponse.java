package com.capvault.backend.tracker;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrackerWritebackResponse(
    UUID id,
    String studentNumber,
    String teamCode,
    String memberNumber,
    UUID deliverableId,
    String trackerColumnKey,
    Integer daysLate,
    Integer targetRowNumber,
    Integer targetColumnIndex,
    String targetA1Range,
    TrackerWritebackStatus status,
    String message,
    LocalDateTime requestedAt,
    LocalDateTime writtenAt
) {

    public static TrackerWritebackResponse from(TrackerWriteback writeback) {
        return new TrackerWritebackResponse(
            writeback.getId(),
            writeback.getStudentNumber(),
            writeback.getTeamCode(),
            writeback.getMemberNumber(),
            writeback.getDeliverable() == null ? null : writeback.getDeliverable().getId(),
            writeback.getTrackerColumnKey(),
            writeback.getDaysLate(),
            writeback.getTargetRowNumber(),
            writeback.getTargetColumnIndex(),
            writeback.getTargetA1Range(),
            writeback.getStatus(),
            writeback.getMessage(),
            writeback.getRequestedAt(),
            writeback.getWrittenAt()
        );
    }
}
