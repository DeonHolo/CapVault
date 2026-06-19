package com.capvault.backend.tracker;

public enum TrackerWritebackStatus {
    LOCAL_UPDATED,
    WRITTEN_TO_SHEET,
    PENDING_GOOGLE_CREDENTIALS,
    FAILED
}
