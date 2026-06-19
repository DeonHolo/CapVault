package com.capvault.backend.health;

import java.time.Instant;
import java.util.List;

public record HealthResponse(
    String status,
    String service,
    List<String> profiles,
    Instant checkedAt
) {
}
