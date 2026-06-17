package edu.cit.capvault.repository;

import edu.cit.capvault.domain.ArchiveRecord;
import edu.cit.capvault.domain.HashCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HashCheckRepository extends JpaRepository<HashCheck, Long> {
    List<HashCheck> findByArchiveRecordOrderByCheckedAtDesc(ArchiveRecord archiveRecord);
}
