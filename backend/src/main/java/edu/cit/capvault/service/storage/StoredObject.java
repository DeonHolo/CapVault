package edu.cit.capvault.service.storage;

public record StoredObject(
        String provider,
        String key,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String sha256
) {
}
