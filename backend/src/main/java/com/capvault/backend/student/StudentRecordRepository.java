package com.capvault.backend.student;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRecordRepository extends JpaRepository<StudentRecord, UUID> {

    List<StudentRecord> findAllByOrderByTeamCodeAscMemberNumberAscStudentNameAsc();

    Optional<StudentRecord> findByStudentNumberIgnoreCase(String studentNumber);

    Optional<StudentRecord> findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCase(String teamCode, String memberNumber);
}
