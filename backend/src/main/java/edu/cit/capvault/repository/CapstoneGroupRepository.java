package edu.cit.capvault.repository;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CapstoneGroupRepository extends JpaRepository<CapstoneGroup, Long> {
    Optional<CapstoneGroup> findByTeamCodeIgnoreCase(String teamCode);

    List<CapstoneGroup> findByAdviserOrderByTeamCodeAsc(UserAccount adviser);

    List<CapstoneGroup> findAllByOrderByTeamCodeAsc();
}
