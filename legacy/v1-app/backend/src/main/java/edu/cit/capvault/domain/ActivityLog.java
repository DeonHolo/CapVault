package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "activity_logs")
public class ActivityLog extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private UserAccount actor;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String subjectType;

    @Column
    private Long subjectId;

    @Column(nullable = false, length = 1600)
    private String details;

    @Column(nullable = false)
    private Instant occurredAt;

    protected ActivityLog() {
    }

    public ActivityLog(UserAccount actor, String action, String subjectType, Long subjectId, String details) {
        this.actor = actor;
        this.action = action;
        this.subjectType = subjectType;
        this.subjectId = subjectId;
        this.details = details;
        this.occurredAt = Instant.now();
    }

    public UserAccount getActor() {
        return actor;
    }

    public String getAction() {
        return action;
    }

    public String getSubjectType() {
        return subjectType;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public String getDetails() {
        return details;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
