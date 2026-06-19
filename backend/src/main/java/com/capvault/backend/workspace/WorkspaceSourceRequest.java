package com.capvault.backend.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WorkspaceSourceRequest(
    @NotBlank(message = "Sheet URL is required")
    @Size(max = 2048, message = "Sheet URL is too long")
    String sheetUrl,

    @Size(max = 200, message = "Display name is too long")
    String displayName,

    WorkspaceSourceStatus status
) {
}
