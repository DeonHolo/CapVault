package com.capvault.backend.sheets;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "capvault.google.sheets", name = "enabled", havingValue = "true")
public class GoogleSheetsApiGateway implements GoogleSheetsGateway {

    private final GoogleSheetsProperties properties;

    public GoogleSheetsApiGateway(GoogleSheetsProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean isConfigured() {
        return properties.enabled()
            && properties.serviceAccountJsonPath() != null
            && !properties.serviceAccountJsonPath().isBlank();
    }

    @Override
    public void updateSingleCell(String spreadsheetId, String a1Range, String value) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google Sheets API is enabled, but no service account JSON path is configured.");
        }

        try {
            Sheets sheets = buildSheetsClient();
            ValueRange body = new ValueRange().setValues(List.of(List.of(value)));
            sheets.spreadsheets()
                .values()
                .update(spreadsheetId, a1Range, body)
                .setValueInputOption("RAW")
                .execute();
        } catch (IOException | GeneralSecurityException exception) {
            throw new IllegalStateException("Google Sheets writeback failed: " + exception.getMessage(), exception);
        }
    }

    private Sheets buildSheetsClient() throws IOException, GeneralSecurityException {
        GoogleCredentials credentials;
        try (FileInputStream input = new FileInputStream(properties.serviceAccountJsonPath())) {
            credentials = GoogleCredentials.fromStream(input)
                .createScoped(List.of(SheetsScopes.SPREADSHEETS));
        }

        return new Sheets.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials)
        )
            .setApplicationName(properties.applicationName())
            .build();
    }
}
