package com.capvault.backend.workspace;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceSourceRepository extends JpaRepository<WorkspaceSource, UUID> {

    Optional<WorkspaceSource> findBySourceType(WorkspaceSourceType sourceType);

    List<WorkspaceSource> findAllByOrderBySourceTypeAsc();
}
