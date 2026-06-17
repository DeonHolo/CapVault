package edu.cit.capvault.repository;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.GroupMember;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupOrderByMemberNumberAsc(CapstoneGroup group);

    Optional<GroupMember> findByStudent(UserAccount student);

    Optional<GroupMember> findByStudentNumber(String studentNumber);

    Optional<GroupMember> findByGroupAndMemberNumber(CapstoneGroup group, int memberNumber);
}
