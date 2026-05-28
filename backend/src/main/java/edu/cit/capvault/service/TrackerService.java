package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrackerService {
    private final TrackerRowRepository trackerRows;
    private final CapstoneGroupRepository groups;
    private final GroupMemberRepository groupMembers;
    private final SubmissionRepository submissions;
    private final ClassRecordImportService classRecordImportService;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;
    private final AccessControlService accessControl;

    public TrackerService(TrackerRowRepository trackerRows, CapstoneGroupRepository groups, GroupMemberRepository groupMembers, SubmissionRepository submissions, ClassRecordImportService classRecordImportService, ActivityLogService activityLog, DtoMapper mapper, AccessControlService accessControl) {
        this.trackerRows = trackerRows;
        this.groups = groups;
        this.groupMembers = groupMembers;
        this.submissions = submissions;
        this.classRecordImportService = classRecordImportService;
        this.activityLog = activityLog;
        this.mapper = mapper;
        this.accessControl = accessControl;
    }

    public CapVaultDtos.TrackerResponse list(UserAccount currentUser, String search, String teamCode, String milestoneKey, TrackerStatus status) {
        List<TrackerRow> rows = visibleRows(currentUser);
        List<TrackerRow> filtered = rows.stream()
                .filter(row -> teamCode == null || teamCode.isBlank() || row.getTeamCode().equalsIgnoreCase(teamCode))
                .filter(row -> search == null || search.isBlank() || matches(row, search))
                .filter(row -> milestoneKey == null || milestoneKey.isBlank() || row.getCells().stream().anyMatch(cell -> cell.getMilestoneKey().equalsIgnoreCase(milestoneKey)))
                .filter(row -> status == null || row.getCells().stream().anyMatch(cell -> cell.getNormalizedStatus() == status))
                .toList();
        return new CapVaultDtos.TrackerResponse(
                filtered.stream().map(mapper::trackerRow).toList(),
                teamProgress(rows),
                milestoneProgress(rows),
                recentlyUpdated(rows)
        );
    }

    public CapVaultDtos.TrackerResponse me(UserAccount currentUser) {
        if (currentUser.getRole() == Role.STUDENT) {
            Optional<GroupMember> member = groupMembers.findByStudent(currentUser);
            if (member.isPresent()) {
                List<TrackerRow> rows = trackerRows.findByGroupOrderByMemberNumberAsc(member.get().getGroup());
                return new CapVaultDtos.TrackerResponse(rows.stream().map(mapper::trackerRow).toList(), teamProgress(rows), milestoneProgress(rows), recentlyUpdated(rows));
            }
        }
        return list(currentUser, null, null, null, null);
    }

    public CapVaultDtos.TrackerResponse byGroup(UserAccount currentUser, Long groupId) {
        CapstoneGroup group = groups.findById(groupId).orElseThrow(() -> new IllegalArgumentException("Group not found."));
        accessControl.requireGroupAccess(currentUser, group);
        List<TrackerRow> rows = trackerRows.findByGroupOrderByMemberNumberAsc(group);
        return new CapVaultDtos.TrackerResponse(rows.stream().map(mapper::trackerRow).toList(), teamProgress(rows), milestoneProgress(rows), recentlyUpdated(rows));
    }

    @Transactional
    public CapVaultDtos.TrackerRowDto updateRow(UserAccount actor, Long rowId, Map<String, String> values) {
        TrackerRow row = trackerRows.findById(rowId).orElseThrow(() -> new IllegalArgumentException("Tracker row not found."));
        values.forEach((key, rawValue) -> row.getCells().stream()
                .filter(cell -> cell.getMilestoneKey().equalsIgnoreCase(key) || cell.getLabel().equalsIgnoreCase(key))
                .findFirst()
                .ifPresent(cell -> {
                    cell.setRawValue(rawValue);
                    cell.setNormalizedStatus(classRecordImportService.normalize(rawValue));
                    cell.setLastSyncedAt(Instant.now());
                    cell.markManualUpdate(actor);
                }));
        activityLog.record(actor, "TRACKER_ROW_UPDATED", "TrackerRow", row.getId(), row.getTeamCode() + " member " + row.getMemberNumber() + " tracker cells were updated.");
        return mapper.trackerRow(row);
    }

    public Map<String, SubmissionStatus> linkedSubmissionStatuses(TrackerRow row) {
        if (row.getGroup() == null) {
            return Map.of();
        }
        return submissions.findByGroupOrderBySubmittedAtDesc(row.getGroup()).stream()
                .collect(Collectors.toMap(
                        submission -> submission.getDeliverable().getMilestoneKey(),
                        Submission::getStatus,
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
    }

    private List<TrackerRow> visibleRows(UserAccount user) {
        if (user.getRole() == Role.STUDENT) {
            return trackerRows.findAllByOrderByTeamCodeAscMemberNumberAsc();
        }
        if (user.getRole() == Role.ADVISER) {
            List<CapstoneGroup> assigned = groups.findByAdviserOrderByTeamCodeAsc(user);
            Set<Long> assignedIds = assigned.stream().map(CapstoneGroup::getId).collect(Collectors.toSet());
            return trackerRows.findAllByOrderByTeamCodeAscMemberNumberAsc().stream()
                    .filter(row -> row.getGroup() == null || assignedIds.contains(row.getGroup().getId()))
                    .toList();
        }
        return trackerRows.findAllByOrderByTeamCodeAscMemberNumberAsc();
    }

    private boolean matches(TrackerRow row, String query) {
        String lowered = query.toLowerCase(Locale.ROOT);
        if (row.getStudentName().toLowerCase(Locale.ROOT).contains(lowered)
                || row.getTeamCode().toLowerCase(Locale.ROOT).contains(lowered)
                || row.getStudentNumber().toLowerCase(Locale.ROOT).contains(lowered)
                || String.valueOf(row.getMemberNumber()).equals(lowered)) {
            return true;
        }
        return row.getCells().stream().anyMatch(cell ->
                cell.getLabel().toLowerCase(Locale.ROOT).contains(lowered)
                        || cell.getMilestoneKey().toLowerCase(Locale.ROOT).contains(lowered)
                        || (cell.getRawValue() != null && cell.getRawValue().toLowerCase(Locale.ROOT).contains(lowered))
                        || cell.getNormalizedStatus().name().toLowerCase(Locale.ROOT).contains(lowered)
        );
    }

    public List<CapVaultDtos.TeamProgressDto> teamProgress(List<TrackerRow> rows) {
        return rows.stream().collect(Collectors.groupingBy(TrackerRow::getTeamCode, LinkedHashMap::new, Collectors.toList()))
                .entrySet().stream()
                .map(entry -> {
                    List<TrackerCell> cells = entry.getValue().stream().flatMap(row -> row.getCells().stream()).toList();
                    long applicable = cells.stream().filter(cell -> cell.getNormalizedStatus() != TrackerStatus.NOT_APPLICABLE).count();
                    long complete = cells.stream().filter(cell -> cell.getNormalizedStatus() == TrackerStatus.COMPLETE || cell.getNormalizedStatus() == TrackerStatus.IN_PROGRESS || cell.getNormalizedStatus() == TrackerStatus.RAW_VALUE).count();
                    long missing = cells.stream().filter(cell -> cell.getNormalizedStatus() == TrackerStatus.MISSING).count();
                    double coverage = applicable == 0 ? 0.0 : (complete * 100.0 / applicable);
                    return new CapVaultDtos.TeamProgressDto(entry.getKey(), entry.getValue().size(), complete, applicable, missing, round(coverage));
                })
                .toList();
    }

    public List<CapVaultDtos.MilestoneProgressDto> milestoneProgress(List<TrackerRow> rows) {
        Map<String, List<TrackerCell>> byMilestone = rows.stream()
                .flatMap(row -> row.getCells().stream())
                .collect(Collectors.groupingBy(TrackerCell::getMilestoneKey, LinkedHashMap::new, Collectors.toList()));
        return byMilestone.entrySet().stream()
                .map(entry -> {
                    List<TrackerCell> cells = entry.getValue();
                    long applicable = cells.stream().filter(cell -> cell.getNormalizedStatus() != TrackerStatus.NOT_APPLICABLE).count();
                    long complete = cells.stream().filter(cell -> cell.getNormalizedStatus() == TrackerStatus.COMPLETE || cell.getNormalizedStatus() == TrackerStatus.IN_PROGRESS || cell.getNormalizedStatus() == TrackerStatus.RAW_VALUE).count();
                    long missing = cells.stream().filter(cell -> cell.getNormalizedStatus() == TrackerStatus.MISSING).count();
                    long na = cells.stream().filter(cell -> cell.getNormalizedStatus() == TrackerStatus.NOT_APPLICABLE).count();
                    String label = cells.isEmpty() ? entry.getKey() : cells.getFirst().getLabel();
                    double coverage = applicable == 0 ? 0.0 : (complete * 100.0 / applicable);
                    return new CapVaultDtos.MilestoneProgressDto(entry.getKey(), label, complete, applicable, missing, na, round(coverage));
                })
                .toList();
    }

    private List<CapVaultDtos.TrackerCellDto> recentlyUpdated(List<TrackerRow> rows) {
        return rows.stream()
                .flatMap(row -> row.getCells().stream())
                .sorted(Comparator.comparing(TrackerCell::getLastSyncedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(12)
                .map(mapper::trackerCell)
                .toList();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
