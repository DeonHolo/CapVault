package edu.cit.capvault.controller;

import edu.cit.capvault.domain.TrackerStatus;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.ClassRecordImportService;
import edu.cit.capvault.service.TrackerService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tracker")
public class TrackerController {
    private final TrackerService tracker;
    private final ClassRecordImportService classRecords;
    private final CurrentUserService currentUser;

    public TrackerController(TrackerService tracker, ClassRecordImportService classRecords, CurrentUserService currentUser) {
        this.tracker = tracker;
        this.classRecords = classRecords;
        this.currentUser = currentUser;
    }

    @GetMapping
    public CapVaultDtos.TrackerResponse list(@RequestParam(required = false) String search,
                                             @RequestParam(required = false) String teamCode,
                                             @RequestParam(required = false) String milestoneKey,
                                             @RequestParam(required = false) TrackerStatus status) {
        return tracker.list(currentUser.requireCurrentUser(), search, teamCode, milestoneKey, status);
    }

    @GetMapping("/me")
    public CapVaultDtos.TrackerResponse me() {
        return tracker.me(currentUser.requireCurrentUser());
    }

    @GetMapping("/groups/{groupId}")
    public CapVaultDtos.TrackerResponse byGroup(@PathVariable Long groupId) {
        return tracker.byGroup(currentUser.requireCurrentUser(), groupId);
    }

    @PatchMapping("/rows/{rowId}")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.TrackerRowDto update(@PathVariable Long rowId, @Valid @RequestBody CapVaultDtos.TrackerUpdateRequest request) {
        return tracker.updateRow(currentUser.requireCurrentUser(), rowId, request.values());
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.ClassRecordImportDto sync(@Valid @RequestBody CapVaultDtos.ClassRecordSyncRequest request) {
        return classRecords.sync(request.sourceUrl(), request.mapping(), currentUser.requireCurrentUser());
    }
}
