package edu.cit.capvault.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "adviser_assignments")
public class AdviserAssignment extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id")
    private CapstoneGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adviser_id")
    private UserAccount adviser;

    private Instant assignedAt;

    private boolean active = true;

    protected AdviserAssignment() {
    }

    public AdviserAssignment(CapstoneGroup group, UserAccount adviser) {
        this.group = group;
        this.adviser = adviser;
        this.assignedAt = Instant.now();
    }

    public CapstoneGroup getGroup() {
        return group;
    }

    public UserAccount getAdviser() {
        return adviser;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
