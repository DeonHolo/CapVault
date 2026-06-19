package com.capvault.backend.tracker;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TrackerWritebackRequest(
    String studentNumber,

    @NotBlank(message = "Team code is required")
    String teamCode,

    String memberNumber,

    UUID deliverableId,

    @NotBlank(message = "Tracker column is required")
    String trackerColumnKey,

    @NotNull(message = "Days late is required")
    @Min(value = 0, message = "Days late cannot be negative")
    Integer daysLate,

    Boolean writeToGoogleSheet
) {
}
