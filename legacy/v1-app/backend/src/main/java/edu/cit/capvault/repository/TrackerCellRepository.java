package edu.cit.capvault.repository;

import edu.cit.capvault.domain.TrackerCell;
import edu.cit.capvault.domain.TrackerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrackerCellRepository extends JpaRepository<TrackerCell, Long> {
    List<TrackerCell> findByMilestoneKeyIgnoreCase(String milestoneKey);

    long countByNormalizedStatus(TrackerStatus status);
}
