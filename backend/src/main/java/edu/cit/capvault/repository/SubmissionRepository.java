package edu.cit.capvault.repository;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.Deliverable;
import edu.cit.capvault.domain.Submission;
import edu.cit.capvault.domain.SubmissionStatus;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByGroupOrderBySubmittedAtDesc(CapstoneGroup group);

    List<Submission> findByStudentOrderBySubmittedAtDesc(UserAccount student);

    List<Submission> findByGroupInOrderBySubmittedAtDesc(Collection<CapstoneGroup> groups);

    Optional<Submission> findFirstByDeliverableAndGroupOrderBySubmittedAtDesc(Deliverable deliverable, CapstoneGroup group);

    long countByStatus(SubmissionStatus status);
}
