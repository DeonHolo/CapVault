package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class ReportService {
    private final CapstoneGroupRepository groups;
    private final GroupMemberRepository groupMembers;
    private final DeliverableRepository deliverables;
    private final SubmissionRepository submissions;
    private final DocumentVersionRepository documentVersions;
    private final ArchiveRecordRepository archives;
    private final HashCheckRepository hashChecks;
    private final TrackerRowRepository trackerRows;
    private final NotificationService notificationService;
    private final TrackerService trackerService;
    private final DtoMapper mapper;

    public ReportService(CapstoneGroupRepository groups, GroupMemberRepository groupMembers, DeliverableRepository deliverables, SubmissionRepository submissions, DocumentVersionRepository documentVersions, ArchiveRecordRepository archives, HashCheckRepository hashChecks, TrackerRowRepository trackerRows, NotificationService notificationService, TrackerService trackerService, DtoMapper mapper) {
        this.groups = groups;
        this.groupMembers = groupMembers;
        this.deliverables = deliverables;
        this.submissions = submissions;
        this.documentVersions = documentVersions;
        this.archives = archives;
        this.hashChecks = hashChecks;
        this.trackerRows = trackerRows;
        this.notificationService = notificationService;
        this.trackerService = trackerService;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public CapVaultDtos.ReportDto report(UserAccount user) {
        List<TrackerRow> rows = trackerRows.findAllByOrderByTeamCodeAscMemberNumberAsc();
        CapVaultDtos.DashboardSummaryDto summary = summary(user);
        List<CapVaultDtos.ReportRowDto> reportRows = submissions.findAll().stream()
                .sorted(Comparator.comparing(Submission::getSubmittedAt).reversed())
                .map(submission -> {
                    ArchiveStatus archiveStatus = documentVersions.findFirstBySubmissionOrderByVersionNumberDesc(submission)
                            .flatMap(archives::findByDocumentVersion)
                            .map(ArchiveRecord::getStatus)
                            .orElse(null);
                    return new CapVaultDtos.ReportRowDto(
                            submission.getGroup().getTeamCode(),
                            submission.getGroup().getProjectTitle(),
                            submission.getGroup().getAdviser() == null ? "Unassigned" : submission.getGroup().getAdviser().getDisplayName(),
                            submission.getDeliverable().getTitle(),
                            submission.getStatus(),
                            archiveStatus,
                            submission.getCurrentVersion(),
                            submission.getDeliverable().getDueAt(),
                            submission.getSubmittedAt()
                    );
                })
                .toList();
        List<CapVaultDtos.HashCheckDto> integrity = hashChecks.findAll().stream().map(mapper::hashCheck).toList();
        return new CapVaultDtos.ReportDto(summary, reportRows, trackerService.teamProgress(rows), trackerService.milestoneProgress(rows), integrity);
    }

    @Transactional(readOnly = true)
    public CapVaultDtos.DashboardSummaryDto summary(UserAccount user) {
        long finalCount = submissions.findAll().stream().filter(item -> item.getStatus() == SubmissionStatus.FINAL).count();
        long late = submissions.findAll().stream().filter(item -> item.getStatus() == SubmissionStatus.LATE).count();
        long approved = submissions.findAll().stream().filter(item -> item.getStatus() == SubmissionStatus.APPROVED).count();
        long missing = deliverables.findAll().stream()
                .filter(deliverable -> deliverable.getGroup() != null)
                .filter(deliverable -> submissions.findFirstByDeliverableAndGroupOrderBySubmittedAtDesc(deliverable, deliverable.getGroup()).isEmpty())
                .count();
        return new CapVaultDtos.DashboardSummaryDto(
                groups.count(),
                groupMembers.count(),
                deliverables.count(),
                submissions.count(),
                missing,
                late,
                approved,
                finalCount,
                archives.countByStatus(ArchiveStatus.ARCHIVED),
                archives.countByStatus(ArchiveStatus.FAILED),
                notificationService.unreadCount(user)
        );
    }

    @Transactional(readOnly = true)
    public String exportCsv(UserAccount user) {
        StringBuilder builder = new StringBuilder("Team Code,Project Title,Adviser,Deliverable,Submission Status,Archive Status,Version,Due At,Submitted At\n");
        for (CapVaultDtos.ReportRowDto row : report(user).rows()) {
            builder.append(csv(row.teamCode())).append(',')
                    .append(csv(row.projectTitle())).append(',')
                    .append(csv(row.adviserName())).append(',')
                    .append(csv(row.deliverableTitle())).append(',')
                    .append(csv(row.submissionStatus() == null ? "" : row.submissionStatus().name())).append(',')
                    .append(csv(row.archiveStatus() == null ? "" : row.archiveStatus().name())).append(',')
                    .append(row.versionNumber()).append(',')
                    .append(csv(row.dueAt() == null ? "" : row.dueAt().toString())).append(',')
                    .append(csv(row.submittedAt() == null ? "" : row.submittedAt().toString())).append('\n');
        }
        return builder.toString();
    }

    private String csv(String value) {
        String safe = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + safe + "\"";
    }
}
