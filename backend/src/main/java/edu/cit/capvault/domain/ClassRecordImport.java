package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "class_record_imports")
public class ClassRecordImport extends BaseEntity {
    @Column(nullable = false, length = 1200)
    private String sourceUrl;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private int importedRows;

    @Column(nullable = false)
    private int errorRows;

    @Column(nullable = false, length = 1600)
    private String rawHeaders;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant completedAt;

    @Column(length = 2000)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by_id")
    private UserAccount importedBy;

    protected ClassRecordImport() {
    }

    public ClassRecordImport(String sourceUrl, String rawHeaders, UserAccount importedBy) {
        this.sourceUrl = sourceUrl;
        this.status = "Processing";
        this.rawHeaders = rawHeaders;
        this.importedBy = importedBy;
        this.startedAt = Instant.now();
    }

    public void complete(int importedRows, int errorRows, String message) {
        this.status = errorRows == 0 ? "Completed" : "Completed with warnings";
        this.importedRows = importedRows;
        this.errorRows = errorRows;
        this.message = message;
        this.completedAt = Instant.now();
    }

    public void fail(String message) {
        this.status = "Failed";
        this.message = message;
        this.completedAt = Instant.now();
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public String getStatus() {
        return status;
    }

    public int getImportedRows() {
        return importedRows;
    }

    public int getErrorRows() {
        return errorRows;
    }

    public String getRawHeaders() {
        return rawHeaders;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public String getMessage() {
        return message;
    }

    public UserAccount getImportedBy() {
        return importedBy;
    }
}
