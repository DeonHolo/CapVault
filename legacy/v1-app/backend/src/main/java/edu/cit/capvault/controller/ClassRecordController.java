package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.ClassRecordImportService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/class-records")
public class ClassRecordController {
    private final ClassRecordImportService classRecords;
    private final CurrentUserService currentUser;

    public ClassRecordController(ClassRecordImportService classRecords, CurrentUserService currentUser) {
        this.classRecords = classRecords;
        this.currentUser = currentUser;
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.ClassRecordPreviewDto preview(@Valid @RequestBody CapVaultDtos.ClassRecordPreviewRequest request) {
        return classRecords.preview(request.sourceUrl());
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.ClassRecordImportDto sync(@Valid @RequestBody CapVaultDtos.ClassRecordSyncRequest request) {
        return classRecords.sync(request.sourceUrl(), request.mapping(), currentUser.requireCurrentUser());
    }

    @GetMapping("/imports")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CapVaultDtos.ClassRecordImportDto> imports() {
        return classRecords.recentImports();
    }

    @DeleteMapping("/dev/reset-tracker")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.ClassRecordResetDto resetImportedTracker() {
        return classRecords.resetImportedTracker(currentUser.requireCurrentUser());
    }
}
