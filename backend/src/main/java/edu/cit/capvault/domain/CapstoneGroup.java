package edu.cit.capvault.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "capstone_groups")
public class CapstoneGroup extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String teamCode;

    @Column(nullable = false)
    private String projectTitle;

    @Column(nullable = false)
    private String softwareName;

    @Column(length = 1200)
    private String description;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adviser_id")
    private UserAccount adviser;

    @Column(nullable = false)
    private String projectStatus = "Tracked";

    @Column(nullable = false)
    private String archiveStatus = "Not archived";

    protected CapstoneGroup() {
    }

    public CapstoneGroup(String teamCode, String projectTitle, String softwareName, String description, String section, String category, UserAccount adviser) {
        this.teamCode = teamCode;
        this.projectTitle = projectTitle;
        this.softwareName = softwareName;
        this.description = description;
        this.section = section;
        this.category = category;
        this.adviser = adviser;
    }

    public String getTeamCode() {
        return teamCode;
    }

    public void setTeamCode(String teamCode) {
        this.teamCode = teamCode;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public void setProjectTitle(String projectTitle) {
        this.projectTitle = projectTitle;
    }

    public String getSoftwareName() {
        return softwareName;
    }

    public void setSoftwareName(String softwareName) {
        this.softwareName = softwareName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public UserAccount getAdviser() {
        return adviser;
    }

    public void setAdviser(UserAccount adviser) {
        this.adviser = adviser;
    }

    public String getProjectStatus() {
        return projectStatus;
    }

    public void setProjectStatus(String projectStatus) {
        this.projectStatus = projectStatus;
    }

    public String getArchiveStatus() {
        return archiveStatus;
    }

    public void setArchiveStatus(String archiveStatus) {
        this.archiveStatus = archiveStatus;
    }
}
