package com.capvault.backend.workspace;

import java.time.LocalDateTime;
import java.util.UUID;

public record WorkspaceSourceResponse(
    UUID id,
    WorkspaceSourceType sourceType,
    String sheetUrl,
    String sheetId,
    String displayName,
    WorkspaceSourceStatus status,
    LocalDateTime connectedAt,
    LocalDateTime lastImportedAt
) {

    public static WorkspaceSourceResponse from(WorkspaceSource source) {
        return new WorkspaceSourceResponse(
            source.getId(),
            source.getSourceType(),
            source.getSheetUrl(),
            source.getSheetId(),
            source.getDisplayName(),
            source.getStatus(),
            source.getConnectedAt(),
            source.getLastImportedAt()
        );
    }
}
