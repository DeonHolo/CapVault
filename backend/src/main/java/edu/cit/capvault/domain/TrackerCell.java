package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "tracker_cells")
public class TrackerCell extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tracker_row_id")
    private TrackerRow trackerRow;

    @Column(nullable = false)
    private String milestoneKey;

    @Column(nullable = false)
    private String label;

    @Column(length = 600)
    private String rawValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrackerStatus normalizedStatus;

    @Column(nullable = false)
    private int sourceColumnNumber;

    @Column(nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private Instant lastSyncedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manually_updated_by_id")
    private UserAccount manuallyUpdatedBy;

    private Instant manuallyUpdatedAt;

    protected TrackerCell() {
    }

    public TrackerCell(String milestoneKey, String label, String rawValue, TrackerStatus normalizedStatus, int sourceColumnNumber, int displayOrder, Instant lastSyncedAt) {
        this.milestoneKey = milestoneKey;
        this.label = label;
        this.rawValue = rawValue;
        this.normalizedStatus = normalizedStatus;
        this.sourceColumnNumber = sourceColumnNumber;
        this.displayOrder = displayOrder;
        this.lastSyncedAt = lastSyncedAt;
    }

    public TrackerRow getTrackerRow() {
        return trackerRow;
    }

    public void setTrackerRow(TrackerRow trackerRow) {
        this.trackerRow = trackerRow;
    }

    public String getMilestoneKey() {
        return milestoneKey;
    }

    public String getLabel() {
        return label;
    }

    public String getRawValue() {
        return rawValue;
    }

    public void setRawValue(String rawValue) {
        this.rawValue = rawValue;
    }

    public TrackerStatus getNormalizedStatus() {
        return normalizedStatus;
    }

    public void setNormalizedStatus(TrackerStatus normalizedStatus) {
        this.normalizedStatus = normalizedStatus;
    }

    public int getSourceColumnNumber() {
        return sourceColumnNumber;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(Instant lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public UserAccount getManuallyUpdatedBy() {
        return manuallyUpdatedBy;
    }

    public void markManualUpdate(UserAccount updatedBy) {
        this.manuallyUpdatedBy = updatedBy;
        this.manuallyUpdatedAt = Instant.now();
    }

    public Instant getManuallyUpdatedAt() {
        return manuallyUpdatedAt;
    }
}
