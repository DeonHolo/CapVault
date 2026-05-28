package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groups;
    private final CurrentUserService currentUser;

    public GroupController(GroupService groups, CurrentUserService currentUser) {
        this.groups = groups;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<CapVaultDtos.GroupDto> list() {
        return groups.list(currentUser.requireCurrentUser());
    }

    @GetMapping("/{id}")
    public CapVaultDtos.GroupDto get(@PathVariable Long id) {
        return groups.get(currentUser.requireCurrentUser(), id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.GroupDto create(@Valid @RequestBody CapVaultDtos.GroupRequest request) {
        return groups.upsert(currentUser.requireCurrentUser(), null, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.GroupDto update(@PathVariable Long id, @Valid @RequestBody CapVaultDtos.GroupRequest request) {
        return groups.upsert(currentUser.requireCurrentUser(), id, request);
    }

    @PostMapping("/deliverables")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.DeliverableDto createDeliverable(@Valid @RequestBody CapVaultDtos.DeliverableRequest request) {
        return groups.createDeliverable(currentUser.requireCurrentUser(), request);
    }
}
