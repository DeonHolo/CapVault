package com.capvault.backend.sheets;

public record SheetImportRequest(
    String sheetUrl,
    String displayName
) {
}
