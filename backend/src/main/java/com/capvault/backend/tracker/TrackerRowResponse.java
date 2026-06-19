package com.capvault.backend.tracker;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TrackerRowResponse(
    UUID id,
    String studentNumber,
    String studentName,
    String teamCode,
    String memberNumber,
    String sectionName,
    String adviserName,
    Integer sourceRowNumber,
    LocalDateTime updatedAt,
    List<TrackerCellResponse> cells
) {

    public static TrackerRowResponse from(TrackerRow row, List<TrackerCell> cells) {
        return new TrackerRowResponse(
            row.getId(),
            row.getStudentNumber(),
            row.getStudentName(),
            row.getTeamCode(),
            row.getMemberNumber(),
            row.getSectionName(),
            row.getAdviserName(),
            row.getSourceRowNumber(),
            row.getUpdatedAt(),
            cells.stream().map(TrackerCellResponse::from).toList()
        );
    }
}
