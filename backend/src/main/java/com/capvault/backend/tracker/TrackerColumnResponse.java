package com.capvault.backend.tracker;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrackerColumnResponse(
    UUID id,
    String columnKey,
    String label,
    String sourceColumn,
    Integer sourceColumnIndex,
    Integer displayOrder,
    Boolean active,
    Boolean pdfRequired,
    LocalDateTime updatedAt
) {

    public static TrackerColumnResponse from(TrackerColumn column) {
        return new TrackerColumnResponse(
            column.getId(),
            column.getColumnKey(),
            column.getLabel(),
            column.getSourceColumn(),
            column.getSourceColumnIndex(),
            column.getDisplayOrder(),
            column.getActive(),
            column.getPdfRequired(),
            column.getUpdatedAt()
        );
    }
}
