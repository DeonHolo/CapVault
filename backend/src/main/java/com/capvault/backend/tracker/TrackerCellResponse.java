package com.capvault.backend.tracker;

import java.time.LocalDateTime;
import java.util.UUID;

public record TrackerCellResponse(
    UUID id,
    String columnKey,
    String label,
    String rawValue,
    String normalizedStatus,
    Integer sourceRowNumber,
    Integer sourceColumnIndex,
    LocalDateTime updatedAt
) {

    public static TrackerCellResponse from(TrackerCell cell) {
        return new TrackerCellResponse(
            cell.getId(),
            cell.getTrackerColumn().getColumnKey(),
            cell.getTrackerColumn().getLabel(),
            cell.getRawValue(),
            cell.getNormalizedStatus(),
            cell.getSourceRowNumber(),
            cell.getSourceColumnIndex(),
            cell.getUpdatedAt()
        );
    }
}
