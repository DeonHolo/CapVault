package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Service
public class SubmissionService {
    private final DeliverableRepository deliverables;
    private final SubmissionRepository submissions;
    private final DocumentVersionRepository documentVersions;
    private final GroupMemberRepository groupMembers;
    private final FileObjectService fileObjectService;
    private final DriveRetrievalService driveRetrievalService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;

    public SubmissionService(DeliverableRepository deliverables, SubmissionRepository submissions, DocumentVersionRepository documentVersions, GroupMemberRepository groupMembers, FileObjectService fileObjectService, DriveRetrievalService driveRetrievalService, NotificationService notificationService, ActivityLogService activityLog, DtoMapper mapper) {
        this.deliverables = deliverables;
        this.submissions = submissions;
        this.documentVersions = documentVersions;
        this.groupMembers = groupMembers;
        this.fileObjectService = fileObjectService;
        this.driveRetrievalService = driveRetrievalService;
        this.notificationService = notificationService;
        this.activityLog = activityLog;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CapVaultDtos.SubmissionDto> listFor(UserAccount user) {
        List<Submission> visible = switch (user.getRole()) {
            case ADMIN -> submissions.findAll();
            case ADVISER -> submissions.findByGroupInOrderBySubmittedAtDesc(
                    submissions.findAll().stream()
                            .map(Submission::getGroup)
                            .filter(group -> group.getAdviser() != null && group.getAdviser().getId().equals(user.getId()))
                            .distinct()
                            .toList()
            );
            case STUDENT -> submissions.findByStudentOrderBySubmittedAtDesc(user);
        };
        return visible.stream().map(mapper::submission).toList();
    }

    @Transactional
    public CapVaultDtos.SubmissionDto submit(UserAccount student, Long deliverableId, String notes, MultipartFile file, String driveLink) {
        GroupMember member = groupMembers.findByStudent(student).orElseThrow(() -> new IllegalArgumentException("Student is not assigned to a capstone group."));
        Deliverable deliverable = deliverables.findById(deliverableId).orElseThrow(() -> new IllegalArgumentException("Deliverable not found."));
        if (deliverable.getGroup() != null && !deliverable.getGroup().getId().equals(member.getGroup().getId())) {
            throw new IllegalArgumentException("Deliverable is not assigned to the student's group.");
        }
        FileObject stored = captureFile(deliverable, file, driveLink);
        Submission submission = submissions.findFirstByDeliverableAndGroupOrderBySubmittedAtDesc(deliverable, member.getGroup())
                .orElseGet(() -> submissions.save(new Submission(deliverable, member.getGroup(), student, initialStatus(deliverable), 0, Instant.now(), notes)));
        int nextVersion = submission.getCurrentVersion() + 1;
        submission.setCurrentVersion(nextVersion);
        submission.setSubmittedAt(Instant.now());
        submission.setNotes(notes);
        submission.setStatus(initialStatus(deliverable));
        DocumentVersion version = documentVersions.save(new DocumentVersion(submission, nextVersion, stored, driveLink == null || driveLink.isBlank() ? "UPLOAD" : "DRIVE_LINK", driveLink, student));
        if (member.getGroup().getAdviser() != null) {
            notificationService.notify(member.getGroup().getAdviser(), NotificationType.SUBMISSION, "Submission received", member.getGroup().getTeamCode() + " submitted " + deliverable.getTitle() + " version " + version.getVersionNumber() + ".", "/review");
        }
        activityLog.record(student, "SUBMISSION_CREATED", "Submission", submission.getId(), deliverable.getTitle() + " version " + nextVersion + " was submitted.");
        return mapper.submission(submission);
    }

    @Transactional(readOnly = true)
    public byte[] readVersion(Long versionId) {
        DocumentVersion version = documentVersions.findById(versionId).orElseThrow(() -> new IllegalArgumentException("Document version not found."));
        return fileObjectService.read(version.getFileObject());
    }

    private SubmissionStatus initialStatus(Deliverable deliverable) {
        return deliverable.getDueAt() != null && Instant.now().isAfter(deliverable.getDueAt()) ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;
    }

    private FileObject captureFile(Deliverable deliverable, MultipartFile file, String driveLink) {
        if (file != null && !file.isEmpty()) {
            if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                throw new IllegalArgumentException("Only PDF uploads are supported for preservation.");
            }
            try {
                return fileObjectService.store("submissions/" + deliverable.getMilestoneKey(), file.getOriginalFilename(), file.getContentType(), file.getBytes());
            } catch (IOException ex) {
                throw new IllegalArgumentException("Submitted file could not be read.", ex);
            }
        }
        if (driveLink != null && !driveLink.isBlank()) {
            DriveRetrievalService.RetrievedDriveFile retrieved;
            try {
                retrieved = driveRetrievalService.retrieve(driveLink);
            } catch (IllegalArgumentException ex) {
                retrieved = driveRetrievalService.preservedLinkReceipt(driveLink);
            }
            return fileObjectService.store("submissions/" + deliverable.getMilestoneKey(), retrieved.filename(), retrieved.contentType(), retrieved.bytes());
        }
        throw new IllegalArgumentException("Attach a PDF or provide an accessible Google Drive link.");
    }
}
