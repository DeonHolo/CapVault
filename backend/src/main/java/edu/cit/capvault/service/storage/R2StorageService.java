package edu.cit.capvault.service.storage;

import edu.cit.capvault.config.CapVaultProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.text.Normalizer;
import java.time.Instant;
import java.util.UUID;

@Service
@ConditionalOnExpression("'${capvault.storage.provider:local}' == 'r2'")
public class R2StorageService implements StorageService {
    private final S3Client s3;
    private final String bucket;

    public R2StorageService(CapVaultProperties properties) {
        CapVaultProperties.R2 r2 = properties.storage().r2();
        this.bucket = require(r2.bucket(), "R2 bucket");
        String region = r2.region() == null || r2.region().isBlank() ? "auto" : r2.region();
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(require(r2.endpoint(), "R2 endpoint")))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        require(r2.accessKeyId(), "R2 access key ID"),
                        require(r2.secretAccessKey(), "R2 secret access key")
                )))
                .region(Region.of(region))
                .forcePathStyle(true)
                .build();
    }

    @Override
    public StoredObject store(String category, String originalFilename, String contentType, byte[] bytes) {
        String key = sanitize(category) + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + "-" + sanitize(originalFilename);
        String sha256 = Hashing.sha256(bytes);
        s3.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .metadata(java.util.Map.of("sha256", sha256, "original-filename", originalFilename))
                .build(), RequestBody.fromBytes(bytes));
        return new StoredObject(provider(), key, originalFilename, contentType, bytes.length, sha256);
    }

    @Override
    public byte[] read(String key) throws IOException {
        try (var response = s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            return response.readAllBytes();
        }
    }

    @Override
    public String provider() {
        return "r2";
    }

    private static String require(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(label + " must be configured when capvault.storage.provider=r2.");
        }
        return value;
    }

    private static String sanitize(String value) {
        String normalized = Normalizer.normalize(value == null ? "file" : value, Normalizer.Form.NFKD);
        return normalized.replaceAll("[^a-zA-Z0-9._-]+", "-").replaceAll("-{2,}", "-").replaceAll("(^-|-$)", "");
    }
}
