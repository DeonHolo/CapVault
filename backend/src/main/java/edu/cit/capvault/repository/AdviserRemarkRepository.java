package edu.cit.capvault.repository;

import edu.cit.capvault.domain.AdviserRemark;
import edu.cit.capvault.domain.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdviserRemarkRepository extends JpaRepository<AdviserRemark, Long> {
    List<AdviserRemark> findBySubmissionOrderByCreatedAtDesc(Submission submission);
}
