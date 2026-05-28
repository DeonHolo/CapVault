package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "adviser_remarks")
public class AdviserRemark extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_version_id")
    private DocumentVersion documentVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adviser_id")
    private UserAccount adviser;

    @Column(nullable = false, length = 1600)
    private String remarks;

    protected AdviserRemark() {
    }

    public AdviserRemark(Submission submission, DocumentVersion documentVersion, UserAccount adviser, String remarks) {
        this.submission = submission;
        this.documentVersion = documentVersion;
        this.adviser = adviser;
        this.remarks = remarks;
    }

    public Submission getSubmission() {
        return submission;
    }

    public DocumentVersion getDocumentVersion() {
        return documentVersion;
    }

    public UserAccount getAdviser() {
        return adviser;
    }

    public String getRemarks() {
        return remarks;
    }
}
