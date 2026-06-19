package com.capvault.backend.sheets;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "capvault.google.sheets")
public record GoogleSheetsProperties(
    boolean enabled,
    String serviceAccountJsonPath,
    String applicationName
) {
}
