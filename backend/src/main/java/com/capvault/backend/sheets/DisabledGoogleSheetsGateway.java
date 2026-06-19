package com.capvault.backend.sheets;

public class DisabledGoogleSheetsGateway implements GoogleSheetsGateway {

    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public void updateSingleCell(String spreadsheetId, String a1Range, String value) {
        throw new IllegalStateException("Google Sheets API credentials are not configured.");
    }
}
