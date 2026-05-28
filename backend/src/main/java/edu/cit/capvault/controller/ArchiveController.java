package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.ArchiveService;
import edu.cit.capvault.service.HashService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/archive")
public class ArchiveController {
    private final ArchiveService archives;
    private final HashService hashes;
    private final CurrentUserService currentUser;

    public ArchiveController(ArchiveService archives, HashService hashes, CurrentUserService currentUser) {
        this.archives = archives;
        this.hashes = hashes;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<CapVaultDtos.ArchiveDto> list() {
        return archives.list(currentUser.requireCurrentUser());
    }

    @PostMapping("/submissions/{submissionId}/versions/{versionId}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public CapVaultDtos.ArchiveDto archiveVersion(@PathVariable Long submissionId, @PathVariable Long versionId) {
        return archives.archiveVersion(currentUser.requireCurrentUser(), submissionId, versionId);
    }

    @PostMapping("/{archiveId}/retry")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public CapVaultDtos.ArchiveDto retry(@PathVariable Long archiveId) {
        return archives.retry(currentUser.requireCurrentUser(), archiveId);
    }

    @PostMapping("/{archiveId}/verify")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public CapVaultDtos.HashCheckDto verify(@PathVariable Long archiveId) {
        return hashes.verify(currentUser.requireCurrentUser(), archiveId);
    }

    @GetMapping("/{archiveId}/checks")
    public List<CapVaultDtos.HashCheckDto> checks(@PathVariable Long archiveId) {
        return hashes.checks(currentUser.requireCurrentUser(), archiveId);
    }

    @GetMapping("/{archiveId}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long archiveId) {
        byte[] bytes = archives.readArchive(currentUser.requireCurrentUser(), archiveId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=archived-document.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
