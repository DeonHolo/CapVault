package edu.cit.capvault.repository;

import edu.cit.capvault.domain.AdviserAssignment;
import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdviserAssignmentRepository extends JpaRepository<AdviserAssignment, Long> {
    List<AdviserAssignment> findByAdviserAndActiveTrue(UserAccount adviser);

    Optional<AdviserAssignment> findByGroupAndAdviserAndActiveTrue(CapstoneGroup group, UserAccount adviser);
}
