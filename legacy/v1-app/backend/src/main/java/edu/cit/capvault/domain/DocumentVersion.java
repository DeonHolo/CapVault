package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "document_versions")
public class DocumentVersion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @Column(nullable = false)
    private int versionNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_object_id")
    private FileObject fileObject;

    @Column(nullable = false)
    private String sourceType;

    @Column(length = 1000)
    private String sourceLink;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by_id")
    private UserAccount submittedBy;

    protected DocumentVersion() {
    }

    public DocumentVersion(Submission submission, int versionNumber, FileObject fileObject, String sourceType, String sourceLink, UserAccount submittedBy) {
        this.submission = submission;
        this.versionNumber = versionNumber;
        this.fileObject = fileObject;
        this.sourceType = sourceType;
        this.sourceLink = sourceLink;
        this.submittedBy = submittedBy;
    }

    public Submission getSubmission() {
        return submission;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public FileObject getFileObject() {
        return fileObject;
    }

    public String getSourceType() {
        return sourceType;
    }

    public String getSourceLink() {
        return sourceLink;
    }

    public UserAccount getSubmittedBy() {
        return submittedBy;
    }
}
