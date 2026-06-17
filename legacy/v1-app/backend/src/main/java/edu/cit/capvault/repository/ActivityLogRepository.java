package edu.cit.capvault.repository;

import edu.cit.capvault.domain.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop30ByOrderByOccurredAtDesc();
}
