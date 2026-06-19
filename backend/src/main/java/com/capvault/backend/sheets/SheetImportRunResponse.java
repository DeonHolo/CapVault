package com.capvault.backend.sheets;

import java.time.LocalDateTime;
import java.util.UUID;

import com.capvault.backend.workspace.WorkspaceSourceType;

public record SheetImportRunResponse(
    UUID id,
    WorkspaceSourceType sourceType,
    SheetImportStatus status,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    Integer rowsFound,
    Integer columnsFound,
    String warnings,
    String summaryJson
) {

    public static SheetImportRunResponse from(SheetImportRun run) {
        return new SheetImportRunResponse(
            run.getId(),
            run.getSourceType(),
            run.getStatus(),
            run.getStartedAt(),
            run.getCompletedAt(),
            run.getRowsFound(),
            run.getColumnsFound(),
            run.getWarnings(),
            run.getSummaryJson()
        );
    }
}
