package edu.cit.capvault.service;

import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.GroupMemberRepository;
import edu.cit.capvault.repository.UserAccountRepository;
import edu.cit.capvault.security.InstitutionalEmailValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserManagementService {
    private final UserAccountRepository users;
    private final GroupMemberRepository groupMembers;
    private final InstitutionalEmailValidator emailValidator;
    private final DtoMapper mapper;

    public UserManagementService(UserAccountRepository users, GroupMemberRepository groupMembers, InstitutionalEmailValidator emailValidator, DtoMapper mapper) {
        this.users = users;
        this.groupMembers = groupMembers;
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
        String requestedNumber = normalizeStudentNumber(request.studentNumber());
        if (!requestedNumber.isBlank()) {
            users.findAllByStudentNumber(requestedNumber).stream()
                    .filter(account -> user.getId() == null || !account.getId().equals(user.getId()))
                    .findFirst()
                    .ifPresent(account -> {
                        throw new IllegalArgumentException("That student number is already assigned to " + account.getDisplayName() + ".");
                    });
        }
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setRole(request.role());
        user.setStudentNumber(requestedNumber.isBlank() ? null : requestedNumber);
        user.setInstitutionalValidated(institutional);
        user.setEnabled(request.enabled());
        return mapper.user(users.save(user));
    }

    @Transactional
    public CapVaultDtos.StudentVerificationDto verifyStudentNumber(UserAccount currentUser, String studentNumber) {
        if (currentUser.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Only student accounts can verify against a class record student number.");
        }
        String requestedNumber = normalizeStudentNumber(studentNumber);
        if (currentUser.getStudentNumber() != null
                && !currentUser.getStudentNumber().isBlank()
                && !normalizeStudentNumber(currentUser.getStudentNumber()).equals(requestedNumber)) {
            throw new IllegalArgumentException("This account is already verified with a different student number.");
        }
        users.findAllByStudentNumber(requestedNumber).stream()
                .filter(account -> !account.getId().equals(currentUser.getId()))
                .findFirst()
                .ifPresent(account -> {
                    throw new IllegalArgumentException("That student number is already assigned to " + account.getDisplayName() + ".");
                });
        var member = groupMembers.findByStudentNumber(requestedNumber)
                .orElseThrow(() -> new IllegalArgumentException("Student number was not found in the synced class record."));
        if (member.getStudent() != null && !member.getStudent().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("That class record is already connected to " + member.getStudent().getDisplayName() + ".");
        }
        currentUser.setStudentNumber(member.getStudentNumber());
        currentUser.setDisplayName(member.getStudentName());
        currentUser.setInstitutionalValidated(emailValidator.isValid(currentUser.getEmail()));
        currentUser.setEnabled(true);
        member.setStudent(currentUser);
        UserAccount saved = users.save(currentUser);
        return new CapVaultDtos.StudentVerificationDto(
                mapper.user(saved),
                mapper.group(member.getGroup()),
                saved.getDisplayName() + " is verified for " + member.getGroup().getTeamCode() + "."
        );
    }

    @Transactional(readOnly = true)
    public CapVaultDtos.StudentVerificationDto findStudentAccessByNumber(String studentNumber) {
        var member = groupMembers.findByStudentNumber(normalizeStudentNumber(studentNumber))
                .orElseThrow(() -> new IllegalArgumentException("Student number was not found in the synced class record."));
        UserAccount student = member.getStudent();
        if (student == null) {
            throw new IllegalArgumentException("This class record row is not connected to an account yet. Ask an admin to sync the class record again.");
        }
        return new CapVaultDtos.StudentVerificationDto(
                mapper.user(student),
                mapper.group(member.getGroup()),
                member.getStudentName() + " is matched to " + member.getGroup().getTeamCode() + "."
        );
    }

    private String normalizeStudentNumber(String studentNumber) {
        return studentNumber == null ? "" : studentNumber.trim();
    }
}
