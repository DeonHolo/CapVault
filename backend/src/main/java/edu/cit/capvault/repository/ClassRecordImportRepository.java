package edu.cit.capvault.repository;

import edu.cit.capvault.domain.ClassRecordImport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassRecordImportRepository extends JpaRepository<ClassRecordImport, Long> {
    List<ClassRecordImport> findTop10ByOrderByStartedAtDesc();
}
