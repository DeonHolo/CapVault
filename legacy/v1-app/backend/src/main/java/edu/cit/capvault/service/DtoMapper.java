package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class DtoMapper {
    private final GroupMemberRepository groupMembers;
    private final DeliverableRepository deliverables;
    private final DocumentVersionRepository documentVersions;

    public DtoMapper(GroupMemberRepository groupMembers, DeliverableRepository deliverables, DocumentVersionRepository documentVersions) {
        this.groupMembers = groupMembers;
        this.deliverables = deliverables;
        this.documentVersions = documentVersions;
    }

    public CapVaultDtos.UserDto user(UserAccount user) {
        return new CapVaultDtos.UserDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.getStudentNumber(),
                user.isInstitutionalValidated(),
                user.isEnabled()
        );
    }

    public CapVaultDtos.GroupMemberDto member(GroupMember member) {
        return new CapVaultDtos.GroupMemberDto(
                member.getId(),
                member.getStudentNumber(),
                member.getStudentName(),
                member.getStudent() == null ? null : member.getStudent().getEmail(),
                member.getMemberNumber()
        );
    }

    public CapVaultDtos.DeliverableDto deliverable(Deliverable deliverable) {
        return new CapVaultDtos.DeliverableDto(
                deliverable.getId(),
                deliverable.getTitle(),
                deliverable.getMilestoneKey(),
                deliverable.getDescription(),
                deliverable.getRequiredFormat(),
                deliverable.getDueAt(),
                deliverable.getStatus(),
                deliverable.getGroup() == null ? null : deliverable.getGroup().getId()
        );
    }

    public CapVaultDtos.GroupDto group(CapstoneGroup group) {
        List<CapVaultDtos.GroupMemberDto> memberDtos = groupMembers.findByGroupOrderByMemberNumberAsc(group).stream().map(this::member).toList();
        List<CapVaultDtos.DeliverableDto> deliverableDtos = deliverables.findByGroupOrderByDueAtAsc(group).stream().map(this::deliverable).toList();
        UserAccount adviser = group.getAdviser();
        return new CapVaultDtos.GroupDto(
                group.getId(),
                group.getTeamCode(),
                group.getProjectTitle(),
                group.getSoftwareName(),
                group.getDescription(),
                group.getSection(),
                group.getCategory(),
                adviser == null ? "Unassigned" : adviser.getDisplayName(),
                adviser == null ? null : adviser.getEmail(),
                group.getProjectStatus(),
                group.getArchiveStatus(),
                memberDtos,
                deliverableDtos
        );
    }

    public CapVaultDtos.TrackerCellDto trackerCell(TrackerCell cell) {
        return new CapVaultDtos.TrackerCellDto(
                cell.getId(),
                cell.getMilestoneKey(),
                cell.getLabel(),
                cell.getRawValue(),
                cell.getNormalizedStatus(),
                cell.getSourceColumnNumber(),
                cell.getLastSyncedAt(),
                cell.getManuallyUpdatedAt(),
                cell.getManuallyUpdatedBy() == null ? null : cell.getManuallyUpdatedBy().getDisplayName()
        );
    }

    public CapVaultDtos.TrackerRowDto trackerRow(TrackerRow row) {
        return new CapVaultDtos.TrackerRowDto(
                row.getId(),
                row.getGroup() == null ? null : row.getGroup().getId(),
                row.getStudentNumber(),
                row.getStudentName(),
                row.getTeamCode(),
                row.getMemberNumber(),
                row.getSourceRowNumber(),
                row.getCells().stream().sorted(Comparator.comparingInt(TrackerCell::getDisplayOrder)).map(this::trackerCell).toList()
        );
    }

    public CapVaultDtos.DocumentVersionDto documentVersion(DocumentVersion version) {
        FileObject file = version.getFileObject();
        return new CapVaultDtos.DocumentVersionDto(
                version.getId(),
                version.getVersionNumber(),
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSizeBytes(),
                file.getSha256(),
                version.getSourceType(),
                version.getSourceLink(),
                version.getCreatedAt(),
                version.getSubmittedBy().getDisplayName()
        );
    }

    public CapVaultDtos.SubmissionDto submission(Submission submission) {
        List<CapVaultDtos.DocumentVersionDto> versions = documentVersions.findBySubmissionOrderByVersionNumberDesc(submission).stream().map(this::documentVersion).toList();
        return new CapVaultDtos.SubmissionDto(
                submission.getId(),
                submission.getDeliverable().getId(),
                submission.getDeliverable().getTitle(),
                submission.getGroup().getId(),
                submission.getGroup().getTeamCode(),
                submission.getGroup().getProjectTitle(),
                submission.getStudent().getDisplayName(),
                submission.getStudent().getEmail(),
                submission.getStatus(),
                submission.getCurrentVersion(),
                submission.getSubmittedAt(),
                submission.getNotes(),
                submission.getAdviserRemarks(),
                versions
        );
    }

    public CapVaultDtos.ArchiveDto archive(ArchiveRecord archive) {
        FileObject file = archive.getFileObject();
        return new CapVaultDtos.ArchiveDto(
                archive.getId(),
                archive.getGroup().getId(),
                archive.getProjectTitle(),
                archive.getTeamCode(),
                archive.getAdviserName(),
                archive.getDeliverable().getTitle(),
                archive.getDocumentVersion().getVersionNumber(),
                archive.getStatus(),
                archive.getArchiveDate(),
                file == null ? null : file.getOriginalFilename(),
                file == null ? null : file.getSha256(),
                archive.getFailureReason()
        );
    }

    public CapVaultDtos.HashCheckDto hashCheck(HashCheck check) {
        return new CapVaultDtos.HashCheckDto(
                check.getId(),
                check.getArchiveRecord().getId(),
                check.getStoredHash(),
                check.getCurrentHash(),
                check.getResult(),
                check.getCheckedBy() == null ? "System" : check.getCheckedBy().getDisplayName(),
                check.getCheckedAt()
        );
    }

    public CapVaultDtos.DeadlineDto deadline(Deadline deadline) {
        Deliverable deliverable = deadline.getDeliverable();
        CapstoneGroup group = deadline.getGroup();
        return new CapVaultDtos.DeadlineDto(
                deadline.getId(),
                deadline.getTitle(),
                deadline.getDescription(),
                deadline.getDueAt(),
                deliverable == null ? null : deliverable.getId(),
                deliverable == null ? null : deliverable.getTitle(),
                group == null ? null : group.getId(),
                group == null ? null : group.getTeamCode(),
                deadline.getTargetRole(),
                deadline.isActive()
        );
    }

    public CapVaultDtos.AnnouncementDto announcement(Announcement announcement) {
        return new CapVaultDtos.AnnouncementDto(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getBody(),
                announcement.getTargetRole(),
                announcement.getPublishedAt(),
                announcement.getExpiresAt(),
                announcement.getCreatedBy() == null ? "System" : announcement.getCreatedBy().getDisplayName()
        );
    }

    public CapVaultDtos.NotificationDto notification(Notification notification) {
        return new CapVaultDtos.NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.getReadAt() == null,
                notification.getCreatedAt()
        );
    }

    public CapVaultDtos.ActivityLogDto activityLog(ActivityLog log) {
        return new CapVaultDtos.ActivityLogDto(
                log.getId(),
                log.getActor() == null ? "System" : log.getActor().getDisplayName(),
                log.getAction(),
                log.getSubjectType(),
                log.getSubjectId(),
                log.getDetails(),
                log.getOccurredAt()
        );
    }

    public CapVaultDtos.ClassRecordImportDto classRecordImport(ClassRecordImport record) {
        return new CapVaultDtos.ClassRecordImportDto(
                record.getId(),
                record.getSourceUrl(),
                record.getStatus(),
                record.getImportedRows(),
                record.getErrorRows(),
                record.getRawHeaders(),
                record.getStartedAt(),
                record.getCompletedAt(),
                record.getMessage()
        );
    }
}
