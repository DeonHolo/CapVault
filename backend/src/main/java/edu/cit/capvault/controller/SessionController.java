package edu.cit.capvault.controller;

import edu.cit.capvault.domain.Role;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.UserAccountRepository;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.DtoMapper;
import edu.cit.capvault.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/session")
public class SessionController {
    private final UserAccountRepository users;
    private final UserManagementService userManagement;
    private final CurrentUserService currentUserService;
    private final DtoMapper mapper;

    public SessionController(UserAccountRepository users, UserManagementService userManagement, CurrentUserService currentUserService, DtoMapper mapper) {
        this.users = users;
        this.userManagement = userManagement;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @GetMapping("/users")
    public List<CapVaultDtos.UserDto> selectableUsers() {
        return users.findAll().stream().map(mapper::user).toList();
    }

    @GetMapping("/me")
    public CapVaultDtos.UserDto me() {
        return mapper.user(currentUserService.requireCurrentUser());
    }

    @GetMapping("/role/{role}")
    public List<CapVaultDtos.UserDto> byRole(@PathVariable Role role) {
        return userManagement.usersByRole(role);
    }

    @PostMapping("/access/student-number")
    public CapVaultDtos.StudentVerificationDto accessByStudentNumber(@Valid @RequestBody CapVaultDtos.StudentVerificationRequest request) {
        return userManagement.findStudentAccessByNumber(request.studentNumber());
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.UserDto upsert(@Valid @RequestBody CapVaultDtos.UpsertUserRequest request) {
        return userManagement.upsert(request);
    }

    @PostMapping("/verify-student-number")
    @PreAuthorize("hasRole('STUDENT')")
    public CapVaultDtos.StudentVerificationDto verifyStudentNumber(@Valid @RequestBody CapVaultDtos.StudentVerificationRequest request) {
        return userManagement.verifyStudentNumber(currentUserService.requireCurrentUser(), request.studentNumber());
    }
}
