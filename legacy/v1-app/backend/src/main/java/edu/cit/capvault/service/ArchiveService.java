package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.ArchiveRecordRepository;
import edu.cit.capvault.repository.DocumentVersionRepository;
import edu.cit.capvault.repository.SubmissionRepository;
import edu.cit.capvault.service.storage.Hashing;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ArchiveService {
    private final ArchiveRecordRepository archives;
    private final SubmissionRepository submissions;
    private final DocumentVersionRepository versions;
    private final FileObjectService fileObjectService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;
    private final AccessControlService accessControl;

    public ArchiveService(ArchiveRecordRepository archives, SubmissionRepository submissions, DocumentVersionRepository versions, FileObjectService fileObjectService, NotificationService notificationService, ActivityLogService activityLog, DtoMapper mapper, AccessControlService accessControl) {
        this.archives = archives;
        this.submissions = submissions;
        this.versions = versions;
        this.fileObjectService = fileObjectService;
        this.notificationService = notificationService;
        this.activityLog = activityLog;
        this.mapper = mapper;
        this.accessControl = accessControl;
    }

    @Transactional(readOnly = true)
    public List<CapVaultDtos.ArchiveDto> list(UserAccount user) {
        List<ArchiveRecord> visible = switch (user.getRole()) {
            case ADMIN -> archives.findAll();
            case ADVISER -> archives.findByGroupInOrderByArchiveDateDesc(
                    archives.findAll().stream()
                            .map(ArchiveRecord::getGroup)
                            .filter(group -> group.getAdviser() != null && group.getAdviser().getId().equals(user.getId()))
                            .distinct()
                            .toList()
            );
            case STUDENT -> archives.findAll().stream()
                    .filter(archive -> archive.getSubmission().getStudent().getId().equals(user.getId()))
                    .toList();
        };
        return visible.stream().map(mapper::archive).toList();
    }

    @Transactional
    public CapVaultDtos.ArchiveDto archiveVersion(UserAccount actor, Long submissionId, Long versionId) {
        Submission submission = submissions.findById(submissionId).orElseThrow(() -> new IllegalArgumentException("Submission not found."));
        accessControl.requireGroupAccess(actor, submission.getGroup());
        if (submission.getStatus() != SubmissionStatus.APPROVED && submission.getStatus() != SubmissionStatus.FINAL) {
            throw new IllegalArgumentException("Only approved or final submissions can be archived.");
        }
        DocumentVersion version = versionId == null
                ? versions.findFirstBySubmissionOrderByVersionNumberDesc(submission).orElseThrow()
                : versions.findById(versionId).orElseThrow(() -> new IllegalArgumentException("Document version not found."));
        if (!version.getSubmission().getId().equals(submission.getId())) {
            throw new IllegalArgumentException("Document version does not belong to this submission.");
        }
        ArchiveRecord record = archives.findByDocumentVersion(version)
                .orElseGet(() -> archives.save(new ArchiveRecord(submission.getGroup(), submission.getDeliverable(), submission, version, version.getFileObject(), actor, ArchiveStatus.ARCHIVED)));
        record.setStatus(ArchiveStatus.ARCHIVED);
        submission.getGroup().setArchiveStatus("Archived");
        notificationService.notify(submission.getStudent(), NotificationType.ARCHIVE, "Version archived", submission.getDeliverable().getTitle() + " version " + version.getVersionNumber() + " has been archived.", "/archive");
        activityLog.record(actor, "DOCUMENT_ARCHIVED", "ArchiveRecord", record.getId(), submission.getDeliverable().getTitle() + " version " + version.getVersionNumber() + " archived with SHA-256 " + version.getFileObject().getSha256() + ".");
        return mapper.archive(record);
    }

    @Transactional
    public CapVaultDtos.ArchiveDto retry(UserAccount actor, Long archiveId) {
        ArchiveRecord archive = archives.findById(archiveId).orElseThrow(() -> new IllegalArgumentException("Archive record not found."));
        requireArchiveAccess(actor, archive);
        try {
            byte[] bytes = fileObjectService.read(archive.getDocumentVersion().getFileObject());
            String currentHash = Hashing.sha256(bytes);
            if (!currentHash.equals(archive.getDocumentVersion().getFileObject().getSha256())) {
                archive.setStatus(ArchiveStatus.FAILED);
                archive.setFailureReason("Stored file hash no longer matches the document version hash.");
            } else {
                archive.setStatus(ArchiveStatus.ARCHIVED);
                archive.setFailureReason(null);
            }
            activityLog.record(actor, "ARCHIVE_RETRIED", "ArchiveRecord", archive.getId(), "Archive retry completed with status " + archive.getStatus() + ".");
            return mapper.archive(archive);
        } catch (RuntimeException ex) {
            archive.setStatus(ArchiveStatus.FAILED);
            archive.setFailureReason(ex.getMessage());
            return mapper.archive(archive);
        }
    }

    @Transactional(readOnly = true)
    public byte[] readArchive(Long archiveId) {
        ArchiveRecord archive = archives.findById(archiveId).orElseThrow(() -> new IllegalArgumentException("Archive record not found."));
        return fileObjectService.read(archive.getFileObject());
    }

    @Transactional(readOnly = true)
    public byte[] readArchive(UserAccount user, Long archiveId) {
        ArchiveRecord archive = archives.findById(archiveId).orElseThrow(() -> new IllegalArgumentException("Archive record not found."));
        requireArchiveAccess(user, archive);
        return fileObjectService.read(archive.getFileObject());
    }

    private void requireArchiveAccess(UserAccount user, ArchiveRecord archive) {
        accessControl.requireGroupAccess(user, archive.getGroup());
    }
}
