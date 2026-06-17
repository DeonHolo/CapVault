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
@Table(name = "announcements")
public class Announcement extends BaseEntity {
    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1800)
    private String body;

    @Enumerated(EnumType.STRING)
    private Role targetRole;

    @Column(nullable = false)
    private Instant publishedAt;

    private Instant expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private UserAccount createdBy;

    protected Announcement() {
    }

    public Announcement(String title, String body, Role targetRole, Instant publishedAt, Instant expiresAt, UserAccount createdBy) {
        this.title = title;
        this.body = body;
        this.targetRole = targetRole;
        this.publishedAt = publishedAt;
        this.expiresAt = expiresAt;
        this.createdBy = createdBy;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public Role getTargetRole() {
        return targetRole;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }
}
