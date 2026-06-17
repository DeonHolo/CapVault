package edu.cit.capvault.repository;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.TrackerRow;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackerRowRepository extends JpaRepository<TrackerRow, Long> {
    @EntityGraph(attributePaths = {"cells", "group", "member"})
    List<TrackerRow> findAllByOrderByTeamCodeAscMemberNumberAsc();

    @EntityGraph(attributePaths = {"cells", "group", "member"})
    List<TrackerRow> findByGroupOrderByMemberNumberAsc(CapstoneGroup group);

    @EntityGraph(attributePaths = {"cells", "group", "member"})
    Optional<TrackerRow> findByStudentNumber(String studentNumber);

    Optional<TrackerRow> findByTeamCodeIgnoreCaseAndMemberNumber(String teamCode, int memberNumber);
}
