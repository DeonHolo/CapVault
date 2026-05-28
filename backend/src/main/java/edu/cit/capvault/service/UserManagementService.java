package edu.cit.capvault.service;

import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.UserAccountRepository;
import edu.cit.capvault.security.InstitutionalEmailValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserManagementService {
    private final UserAccountRepository users;
    private final InstitutionalEmailValidator emailValidator;
    private final DtoMapper mapper;

    public UserManagementService(UserAccountRepository users, InstitutionalEmailValidator emailValidator, DtoMapper mapper) {
        this.users = users;
        this.emailValidator = emailValidator;
        this.mapper = mapper;
    }

    public List<CapVaultDtos.UserDto> listUsers() {
        return users.findAll().stream().map(mapper::user).toList();
    }

    public List<CapVaultDtos.UserDto> usersByRole(Role role) {
        return users.findByRoleOrderByDisplayNameAsc(role).stream().map(mapper::user).toList();
    }

    @Transactional
    public CapVaultDtos.UserDto upsert(CapVaultDtos.UpsertUserRequest request) {
        boolean institutional = emailValidator.isValid(request.email());
        UserAccount user = users.findByEmailIgnoreCase(request.email())
                .orElseGet(() -> new UserAccount(request.email(), request.displayName(), request.role(), request.studentNumber(), institutional));
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setRole(request.role());
        user.setStudentNumber(request.studentNumber());
        user.setInstitutionalValidated(institutional);
        user.setEnabled(request.enabled());
        return mapper.user(users.save(user));
    }
}
