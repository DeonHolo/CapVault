package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "hash_checks")
public class HashCheck extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "archive_record_id")
    private ArchiveRecord archiveRecord;

    @Column(nullable = false, length = 64)
    private String storedHash;

    @Column(nullable = false, length = 64)
    private String currentHash;

    @Column(nullable = false)
    private String result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by_id")
    private UserAccount checkedBy;

    @Column(nullable = false)
    private Instant checkedAt;

    protected HashCheck() {
    }

    public HashCheck(ArchiveRecord archiveRecord, String storedHash, String currentHash, String result, UserAccount checkedBy) {
        this.archiveRecord = archiveRecord;
        this.storedHash = storedHash;
        this.currentHash = currentHash;
        this.result = result;
        this.checkedBy = checkedBy;
        this.checkedAt = Instant.now();
    }

    public ArchiveRecord getArchiveRecord() {
        return archiveRecord;
    }

    public String getStoredHash() {
        return storedHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public String getResult() {
        return result;
    }

    public UserAccount getCheckedBy() {
        return checkedBy;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }
}
