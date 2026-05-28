package edu.cit.capvault.repository;

import edu.cit.capvault.domain.ArchiveRecord;
import edu.cit.capvault.domain.ArchiveStatus;
import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ArchiveRecordRepository extends JpaRepository<ArchiveRecord, Long> {
    List<ArchiveRecord> findByGroupInOrderByArchiveDateDesc(Collection<CapstoneGroup> groups);

    List<ArchiveRecord> findByGroupOrderByArchiveDateDesc(CapstoneGroup group);

    Optional<ArchiveRecord> findByDocumentVersion(DocumentVersion documentVersion);

    long countByStatus(ArchiveStatus status);
}
