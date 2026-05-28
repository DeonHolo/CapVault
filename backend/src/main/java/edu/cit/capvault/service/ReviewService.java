package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.AdviserRemarkRepository;
import edu.cit.capvault.repository.DocumentVersionRepository;
import edu.cit.capvault.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final SubmissionRepository submissions;
    private final DocumentVersionRepository documentVersions;
    private final AdviserRemarkRepository adviserRemarks;
    private final NotificationService notificationService;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;

    public ReviewService(SubmissionRepository submissions, DocumentVersionRepository documentVersions, AdviserRemarkRepository adviserRemarks, NotificationService notificationService, ActivityLogService activityLog, DtoMapper mapper) {
        this.submissions = submissions;
        this.documentVersions = documentVersions;
        this.adviserRemarks = adviserRemarks;
        this.notificationService = notificationService;
        this.activityLog = activityLog;
        this.mapper = mapper;
    }

    @Transactional
    public CapVaultDtos.SubmissionDto review(UserAccount adviser, Long submissionId, CapVaultDtos.ReviewRequest request) {
        Submission submission = submissions.findById(submissionId).orElseThrow(() -> new IllegalArgumentException("Submission not found."));
        if (submission.getGroup().getAdviser() == null || !submission.getGroup().getAdviser().getId().equals(adviser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Submission is outside this adviser's assigned groups.");
        }
        DocumentVersion version = request.documentVersionId() == null
                ? documentVersions.findFirstBySubmissionOrderByVersionNumberDesc(submission).orElseThrow()
                : documentVersions.findById(request.documentVersionId()).orElseThrow(() -> new IllegalArgumentException("Document version not found."));
        submission.setStatus(request.status());
        submission.setAdviserRemarks(request.remarks());
        submission.setReviewedBy(adviser);
        submission.setReviewedAt(java.time.Instant.now());
        adviserRemarks.save(new AdviserRemark(submission, version, adviser, request.remarks()));
        notificationService.notify(submission.getStudent(), NotificationType.FEEDBACK, "Adviser feedback posted", submission.getDeliverable().getTitle() + " is now " + request.status().name().replace('_', ' ') + ".", "/submissions");
        activityLog.record(adviser, "SUBMISSION_REVIEWED", "Submission", submission.getId(), submission.getDeliverable().getTitle() + " was reviewed as " + request.status() + ".");
        return mapper.submission(submission);
    }
}
