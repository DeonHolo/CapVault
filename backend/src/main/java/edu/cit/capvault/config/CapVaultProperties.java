package edu.cit.capvault.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "capvault")
public record CapVaultProperties(
        String institutionalDomain,
        Seed seed,
        Sheet sheet,
        Storage storage
) {
    public record Seed(boolean enabled) {
    }

    public record Sheet(String defaultSourceUrl) {
    }

    public record Storage(String provider, String localRoot, R2 r2) {
    }

    public record R2(String endpoint, String accessKeyId, String secretAccessKey, String bucket, String region) {
    }
}
