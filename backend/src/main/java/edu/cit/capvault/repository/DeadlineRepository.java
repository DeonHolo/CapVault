package edu.cit.capvault.repository;

import edu.cit.capvault.domain.Deadline;
import edu.cit.capvault.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    List<Deadline> findByActiveTrueOrderByDueAtAsc();

    List<Deadline> findByTargetRoleInOrTargetRoleIsNullOrderByDueAtAsc(Collection<Role> roles);
}
