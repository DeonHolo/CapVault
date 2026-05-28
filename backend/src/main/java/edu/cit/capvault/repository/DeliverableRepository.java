package edu.cit.capvault.repository;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliverableRepository extends JpaRepository<Deliverable, Long> {
    List<Deliverable> findByGroupOrderByDueAtAsc(CapstoneGroup group);

    List<Deliverable> findByGroupIsNullOrderByDueAtAsc();

    Optional<Deliverable> findByGroupAndMilestoneKeyIgnoreCase(CapstoneGroup group, String milestoneKey);
}
