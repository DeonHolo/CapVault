package edu.cit.capvault.repository;

import edu.cit.capvault.domain.Announcement;
import edu.cit.capvault.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByPublishedAtDesc();

    List<Announcement> findByTargetRoleInOrTargetRoleIsNullOrderByPublishedAtDesc(Collection<Role> roles);
}
