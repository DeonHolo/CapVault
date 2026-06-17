package edu.cit.capvault.repository;

import edu.cit.capvault.domain.DocumentVersion;
import edu.cit.capvault.domain.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {
    List<DocumentVersion> findBySubmissionOrderByVersionNumberDesc(Submission submission);

    Optional<DocumentVersion> findFirstBySubmissionOrderByVersionNumberDesc(Submission submission);
}
