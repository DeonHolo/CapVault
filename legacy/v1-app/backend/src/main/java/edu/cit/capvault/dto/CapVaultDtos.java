package edu.cit.capvault.dto;

import edu.cit.capvault.domain.ArchiveStatus;
import edu.cit.capvault.domain.NotificationType;
import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.SubmissionStatus;
import edu.cit.capvault.domain.TrackerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class CapVaultDtos {
    private CapVaultDtos() {
    }

    public record UserDto(
            Long id,
            String email,
            String displayName,
            Role role,
            String studentNumber,
            boolean institutionalValidated,
            boolean enabled
    ) {
    }

    public record UpsertUserRequest(
            @NotBlank @Email String email,
            @NotBlank String displayName,
            @NotNull Role role,
            String studentNumber,
            boolean enabled
    ) {
    }

    public record StudentVerificationRequest(@NotBlank String studentNumber) {
    }

    public record StudentVerificationDto(
            UserDto user,
            GroupDto group,
            String message
    ) {
    }

    public record GroupMemberDto(
            Long id,
            String studentNumber,
            String studentName,
            String email,
            int memberNumber
    ) {
    }

    public record DeliverableDto(
            Long id,
            String title,
            String milestoneKey,
            String description,
            String requiredFormat,
            Instant dueAt,
            SubmissionStatus status,
            Long groupId
    ) {
    }

    public record GroupDto(
            Long id,
            String teamCode,
            String projectTitle,
            String softwareName,
            String description,
            String section,
            String category,
            String adviserName,
            String adviserEmail,
            String projectStatus,
            String archiveStatus,
            List<GroupMemberDto> members,
            List<DeliverableDto> deliverables
    ) {
    }

    public record GroupRequest(
            @NotBlank String teamCode,
            @NotBlank String projectTitle,
            @NotBlank String softwareName,
            String description,
            @NotBlank String section,
            @NotBlank String category,
            @Email String adviserEmail
    ) {
    }

    public record DeliverableRequest(
            @NotBlank String title,
            @NotBlank String milestoneKey,
            String description,
            Instant dueAt,
            Long groupId
    ) {
    }

    public record ClassRecordPreviewRequest(@NotBlank String sourceUrl) {
    }

    public record ClassRecordPreviewDto(
            List<String> columns,
            List<Map<String, String>> sampleRows,
            Map<String, String> suggestedMapping,
            List<String> milestoneColumns,
            List<String> warnings
    ) {
    }

    public record ClassRecordSyncRequest(@NotBlank String sourceUrl, Map<String, String> mapping) {
    }

    public record ClassRecordImportDto(
            Long id,
            String sourceUrl,
            String status,
            int importedRows,
            int errorRows,
            String rawHeaders,
            Instant startedAt,
            Instant completedAt,
            String message
    ) {
    }

    public record ClassRecordResetDto(
            long trackerRowsCleared,
            long importRecordsCleared,
            long importedDeadlinesCleared,
            String message
    ) {
    }

    public record TrackerCellDto(
            Long id,
            String milestoneKey,
            String label,
            String rawValue,
            TrackerStatus normalizedStatus,
            int sourceColumnNumber,
            Instant lastSyncedAt,
            Instant manuallyUpdatedAt,
            String manuallyUpdatedBy
    ) {
    }

    public record TrackerRowDto(
            Long id,
            Long groupId,
            String studentNumber,
            String studentName,
            String teamCode,
            int memberNumber,
            int sourceRowNumber,
            List<TrackerCellDto> cells
    ) {
    }

    public record TeamProgressDto(
            String teamCode,
            int memberCount,
            long completeCells,
            long applicableCells,
            long missingCells,
            double coverage
    ) {
    }

    public record MilestoneProgressDto(
            String milestoneKey,
            String label,
            long completeCells,
            long applicableCells,
            long missingCells,
            long notApplicableCells,
            double coverage
    ) {
    }

    public record TrackerResponse(
            List<TrackerRowDto> rows,
            List<TeamProgressDto> teamProgress,
            List<MilestoneProgressDto> milestoneProgress,
            List<TrackerCellDto> recentlyUpdated
    ) {
    }

    public record TrackerUpdateRequest(@NotNull Map<String, String> values) {
    }

    public record DocumentVersionDto(
            Long id,
            int versionNumber,
            String filename,
            String contentType,
            long sizeBytes,
            String sha256,
            String sourceType,
            String sourceLink,
            Instant createdAt,
            String submittedBy
    ) {
    }

    public record SubmissionDto(
            Long id,
            Long deliverableId,
            String deliverableTitle,
            Long groupId,
            String teamCode,
            String projectTitle,
            String studentName,
            String studentEmail,
            SubmissionStatus status,
            int currentVersion,
            Instant submittedAt,
            String notes,
            String adviserRemarks,
            List<DocumentVersionDto> versions
    ) {
    }

    public record ReviewRequest(
            @NotNull SubmissionStatus status,
            @NotBlank String remarks,
            Long documentVersionId
    ) {
    }

    public record ArchiveDto(
            Long id,
            Long groupId,
            String projectTitle,
            String teamCode,
            String adviserName,
            String deliverableTitle,
            int versionNumber,
            ArchiveStatus status,
            Instant archiveDate,
            String filename,
            String sha256,
            String failureReason
    ) {
    }

    public record HashCheckDto(
            Long id,
            Long archiveRecordId,
            String storedHash,
            String currentHash,
            String result,
            String checkedBy,
            Instant checkedAt
    ) {
    }

    public record DeadlineDto(
            Long id,
            String title,
            String description,
            Instant dueAt,
            Long deliverableId,
            String deliverableTitle,
            Long groupId,
            String teamCode,
            Role targetRole,
            boolean active
    ) {
    }

    public record DeadlineRequest(
            @NotBlank String title,
            String description,
            @NotNull Instant dueAt,
            Long deliverableId,
            Long groupId,
            Role targetRole
    ) {
    }

    public record AnnouncementDto(
            Long id,
            String title,
            String body,
            Role targetRole,
            Instant publishedAt,
            Instant expiresAt,
            String createdBy
    ) {
    }

    public record AnnouncementRequest(
            @NotBlank String title,
            @NotBlank String body,
            Role targetRole,
            Instant expiresAt
    ) {
    }

    public record NotificationDto(
            Long id,
            NotificationType type,
            String title,
            String message,
            String link,
            boolean unread,
            Instant createdAt
    ) {
    }

    public record DashboardSummaryDto(
            long groups,
            long students,
            long deliverables,
            long submissions,
            long missing,
            long late,
            long approved,
            long finalCount,
            long archived,
            long failedArchives,
            long unreadNotifications
    ) {
    }

    public record ReportRowDto(
            String teamCode,
            String projectTitle,
            String adviserName,
            String deliverableTitle,
            SubmissionStatus submissionStatus,
            ArchiveStatus archiveStatus,
            int versionNumber,
            Instant dueAt,
            Instant submittedAt
    ) {
    }

    public record ReportDto(
            DashboardSummaryDto summary,
            List<ReportRowDto> rows,
            List<TeamProgressDto> teamProgress,
            List<MilestoneProgressDto> milestoneProgress,
            List<HashCheckDto> integrityChecks
    ) {
    }

    public record ActivityLogDto(
            Long id,
            String actor,
            String action,
            String subjectType,
            Long subjectId,
            String details,
            Instant occurredAt
    ) {
    }
}
