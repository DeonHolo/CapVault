package com.capvault.backend.sheets;

public interface GoogleSheetsGateway {

    boolean isConfigured();

    void updateSingleCell(String spreadsheetId, String a1Range, String value);
}
