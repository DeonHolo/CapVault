package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.SubmissionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {
    private final SubmissionService submissions;
    private final CurrentUserService currentUser;

    public SubmissionController(SubmissionService submissions, CurrentUserService currentUser) {
        this.submissions = submissions;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<CapVaultDtos.SubmissionDto> list() {
        return submissions.listFor(currentUser.requireCurrentUser());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public CapVaultDtos.SubmissionDto submit(@RequestParam Long deliverableId,
                                             @RequestParam(required = false) String notes,
                                             @RequestPart(required = false) MultipartFile file,
                                             @RequestParam(required = false) String driveLink) {
        return submissions.submit(currentUser.requireCurrentUser(), deliverableId, notes, file, driveLink);
    }

    @GetMapping("/versions/{versionId}/download")
    public ResponseEntity<byte[]> downloadVersion(@PathVariable Long versionId) {
        byte[] bytes = submissions.readVersion(currentUser.requireCurrentUser(), versionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=document-version.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
