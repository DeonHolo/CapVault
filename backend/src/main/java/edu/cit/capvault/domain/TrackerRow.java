package edu.cit.capvault.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tracker_rows")
public class TrackerRow extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private CapstoneGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private GroupMember member;

    @Column(nullable = false)
    private String studentNumber;

    @Column(nullable = false)
    private String studentName;

    @Column(nullable = false)
    private String teamCode;

    @Column(nullable = false)
    private int memberNumber;

    @Column(nullable = false)
    private int sourceRowNumber;

    @OneToMany(mappedBy = "trackerRow", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<TrackerCell> cells = new ArrayList<>();

    protected TrackerRow() {
    }

    public TrackerRow(CapstoneGroup group, GroupMember member, String studentNumber, String studentName, String teamCode, int memberNumber, int sourceRowNumber) {
        this.group = group;
        this.member = member;
        this.studentNumber = studentNumber;
        this.studentName = studentName;
        this.teamCode = teamCode;
        this.memberNumber = memberNumber;
        this.sourceRowNumber = sourceRowNumber;
    }

    public CapstoneGroup getGroup() {
        return group;
    }

    public void setGroup(CapstoneGroup group) {
        this.group = group;
    }

    public GroupMember getMember() {
        return member;
    }

    public void setMember(GroupMember member) {
        this.member = member;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getTeamCode() {
        return teamCode;
    }

    public void setTeamCode(String teamCode) {
        this.teamCode = teamCode;
    }

    public int getMemberNumber() {
        return memberNumber;
    }

    public void setMemberNumber(int memberNumber) {
        this.memberNumber = memberNumber;
    }

    public int getSourceRowNumber() {
        return sourceRowNumber;
    }

    public void setSourceRowNumber(int sourceRowNumber) {
        this.sourceRowNumber = sourceRowNumber;
    }

    public List<TrackerCell> getCells() {
        return cells;
    }

    public void replaceCells(List<TrackerCell> replacement) {
        cells.clear();
        replacement.forEach(cell -> {
            cell.setTrackerRow(this);
            cells.add(cell);
        });
    }
}
