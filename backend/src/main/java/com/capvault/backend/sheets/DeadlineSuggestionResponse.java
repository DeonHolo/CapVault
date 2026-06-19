package com.capvault.backend.sheets;

public record DeadlineSuggestionResponse(
    String trackerColumnKey,
    String title,
    String dueAt,
    Boolean pdfRequired,
    String sourceValue,
    Integer sourceRowNumber
) {
}
