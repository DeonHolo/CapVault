package edu.cit.capvault.repository;

import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findByStudentNumber(String studentNumber);

    List<UserAccount> findAllByStudentNumber(String studentNumber);

    List<UserAccount> findByRoleOrderByDisplayNameAsc(Role role);
}
