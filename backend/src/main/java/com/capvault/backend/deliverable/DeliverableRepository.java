package com.capvault.backend.deliverable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverableRepository extends JpaRepository<Deliverable, UUID> {

    Optional<Deliverable> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    List<Deliverable> findAllByOrderByDueAtAscTitleAsc();
}
