package edu.cit.capvault.service.storage;

import edu.cit.capvault.config.CapVaultProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.time.Instant;
import java.util.UUID;

@Service
@ConditionalOnExpression("'${capvault.storage.provider:local}' == 'local'")
public class LocalFileStorageService implements StorageService {
    private final Path root;

    public LocalFileStorageService(CapVaultProperties properties) throws IOException {
        String configuredRoot = properties.storage() == null ? "storage/archive" : properties.storage().localRoot();
        this.root = Path.of(configuredRoot == null || configuredRoot.isBlank() ? "storage/archive" : configuredRoot).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @Override
    public StoredObject store(String category, String originalFilename, String contentType, byte[] bytes) throws IOException {
        String safeCategory = sanitize(category);
        String safeName = sanitize(originalFilename);
        String key = safeCategory + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + "-" + safeName;
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IOException("Invalid storage target.");
        }
        Files.createDirectories(target.getParent());
        Files.write(target, bytes);
        return new StoredObject(provider(), key, originalFilename, contentType, bytes.length, Hashing.sha256(bytes));
    }

    @Override
    public byte[] read(String key) throws IOException {
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IOException("Invalid storage key.");
        }
        return Files.readAllBytes(target);
    }

    @Override
    public String provider() {
        return "local";
    }

    private static String sanitize(String value) {
        String normalized = Normalizer.normalize(value == null ? "file" : value, Normalizer.Form.NFKD);
        return normalized.replaceAll("[^a-zA-Z0-9._-]+", "-").replaceAll("-{2,}", "-").replaceAll("(^-|-$)", "");
    }
}
