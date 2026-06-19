package com.capvault.backend.deliverable;

import java.time.LocalDateTime;
import java.util.UUID;

public record DeliverableResponse(
    UUID id,
    String trackerColumnKey,
    String title,
    String slug,
    String instructions,
    LocalDateTime dueAt,
    boolean pdfRequired,
    DeliverableStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public static DeliverableResponse from(Deliverable deliverable) {
        return new DeliverableResponse(
            deliverable.getId(),
            deliverable.getTrackerColumnKey(),
            deliverable.getTitle(),
            deliverable.getSlug(),
            deliverable.getInstructions(),
            deliverable.getDueAt(),
            deliverable.isPdfRequired(),
            deliverable.getStatus(),
            deliverable.getCreatedAt(),
            deliverable.getUpdatedAt()
        );
    }
}
