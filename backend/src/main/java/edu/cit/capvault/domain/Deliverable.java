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
@Table(name = "deliverables")
public class Deliverable extends BaseEntity {
    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String milestoneKey;

    @Column(length = 900)
    private String description;

    @Column(nullable = false)
    private String requiredFormat = "PDF";

    private Instant dueAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private CapstoneGroup group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status = SubmissionStatus.ASSIGNED;

    @Column(nullable = false)
    private boolean active = true;

    protected Deliverable() {
    }

    public Deliverable(String title, String milestoneKey, String description, Instant dueAt, CapstoneGroup group) {
        this.title = title;
        this.milestoneKey = milestoneKey;
        this.description = description;
        this.dueAt = dueAt;
        this.group = group;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMilestoneKey() {
        return milestoneKey;
    }

    public void setMilestoneKey(String milestoneKey) {
        this.milestoneKey = milestoneKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequiredFormat() {
        return requiredFormat;
    }

    public void setRequiredFormat(String requiredFormat) {
        this.requiredFormat = requiredFormat;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public CapstoneGroup getGroup() {
        return group;
    }

    public void setGroup(CapstoneGroup group) {
        this.group = group;
    }

    public SubmissionStatus getStatus() {
        return status;
    }

    public void setStatus(SubmissionStatus status) {
        this.status = status;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
