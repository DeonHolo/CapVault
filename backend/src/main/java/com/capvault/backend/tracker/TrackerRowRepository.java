package com.capvault.backend.tracker;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackerRowRepository extends JpaRepository<TrackerRow, UUID> {

    List<TrackerRow> findAllByOrderByTeamCodeAscMemberNumberAscStudentNameAsc();

    Optional<TrackerRow> findByStudentNumberIgnoreCase(String studentNumber);

    Optional<TrackerRow> findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCase(String teamCode, String memberNumber);

    Optional<TrackerRow> findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCaseAndStudentNameIgnoreCase(
        String teamCode,
        String memberNumber,
        String studentName
    );
}
