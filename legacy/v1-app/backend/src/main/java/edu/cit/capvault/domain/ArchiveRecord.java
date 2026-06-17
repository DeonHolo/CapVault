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
@Table(name = "archive_records")
public class ArchiveRecord extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id")
    private CapstoneGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deliverable_id")
    private Deliverable deliverable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_version_id")
    private DocumentVersion documentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_object_id")
    private FileObject fileObject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_id")
    private UserAccount archivedBy;

    @Column(nullable = false)
    private String projectTitle;

    @Column(nullable = false)
    private String teamCode;

    @Column(nullable = false)
    private String adviserName;

    @Column(nullable = false)
    private Instant archiveDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArchiveStatus status;

    @Column(length = 1400)
    private String failureReason;

    protected ArchiveRecord() {
    }

    public ArchiveRecord(CapstoneGroup group, Deliverable deliverable, Submission submission, DocumentVersion documentVersion, FileObject fileObject, UserAccount archivedBy, ArchiveStatus status) {
        this.group = group;
        this.deliverable = deliverable;
        this.submission = submission;
        this.documentVersion = documentVersion;
        this.fileObject = fileObject;
        this.archivedBy = archivedBy;
        this.projectTitle = group.getProjectTitle();
        this.teamCode = group.getTeamCode();
        this.adviserName = group.getAdviser() == null ? "Unassigned" : group.getAdviser().getDisplayName();
        this.archiveDate = Instant.now();
        this.status = status;
    }

    public CapstoneGroup getGroup() {
        return group;
    }

    public Deliverable getDeliverable() {
        return deliverable;
    }

    public Submission getSubmission() {
        return submission;
    }

    public DocumentVersion getDocumentVersion() {
        return documentVersion;
    }

    public FileObject getFileObject() {
        return fileObject;
    }

    public UserAccount getArchivedBy() {
        return archivedBy;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public String getTeamCode() {
        return teamCode;
    }

    public String getAdviserName() {
        return adviserName;
    }

    public Instant getArchiveDate() {
        return archiveDate;
    }

    public ArchiveStatus getStatus() {
        return status;
    }

    public void setStatus(ArchiveStatus status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }
}
