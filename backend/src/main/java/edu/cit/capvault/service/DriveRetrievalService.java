package edu.cit.capvault.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DriveRetrievalService {
    private static final Pattern DRIVE_FILE_PATTERN = Pattern.compile("/d/([a-zA-Z0-9_-]+)");
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public RetrievedDriveFile retrieve(String driveLink) {
        String downloadUrl = toDownloadUrl(driveLink).orElse(driveLink);
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(downloadUrl)).GET().build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            String contentType = response.headers().firstValue("content-type").orElse("application/pdf");
            if (response.statusCode() >= 400 || response.body().length == 0 || contentType.contains("text/html")) {
                throw new IllegalArgumentException("Drive file could not be retrieved. Upload a PDF or grant access to the file.");
            }
            String filename = "drive-capture-" + System.currentTimeMillis() + ".pdf";
            return new RetrievedDriveFile(filename, contentType, response.body());
        } catch (IOException ex) {
            throw new IllegalArgumentException("Drive retrieval failed: " + ex.getMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Drive retrieval was interrupted.", ex);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Drive link is invalid or inaccessible.", ex);
        }
    }

    public RetrievedDriveFile preservedLinkReceipt(String driveLink) {
        String content = """
                %PDF-1.4
                1 0 obj
                << /Type /Catalog /Pages 2 0 R >>
                endobj
                2 0 obj
                << /Type /Pages /Kids [3 0 R] /Count 1 >>
                endobj
                3 0 obj
                << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
                endobj
                4 0 obj
                << /Length 120 >>
                stream
                BT /F1 12 Tf 72 720 Td (CapVault preserved Drive source link.) Tj 0 -24 Td (%s) Tj ET
                endstream
                endobj
                5 0 obj
                << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
                endobj
                xref
                0 6
                0000000000 65535 f 
                trailer
                << /Root 1 0 R /Size 6 >>
                startxref
                0
                %%EOF
                """.formatted(driveLink.replace("(", "[").replace(")", "]"));
        return new RetrievedDriveFile("drive-source-preservation.pdf", "application/pdf", content.getBytes(StandardCharsets.UTF_8));
    }

    private Optional<String> toDownloadUrl(String link) {
        Matcher matcher = DRIVE_FILE_PATTERN.matcher(link);
        if (matcher.find()) {
            return Optional.of("https://drive.google.com/uc?export=download&id=" + matcher.group(1));
        }
        return Optional.empty();
    }

    public record RetrievedDriveFile(String filename, String contentType, byte[] bytes) {
    }
}
