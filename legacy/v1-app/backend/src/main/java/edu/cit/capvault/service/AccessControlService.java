package edu.cit.capvault.service;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.GroupMember;
import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.repository.GroupMemberRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class AccessControlService {
    private final GroupMemberRepository groupMembers;

    public AccessControlService(GroupMemberRepository groupMembers) {
        this.groupMembers = groupMembers;
    }

    public void requireGroupAccess(UserAccount user, CapstoneGroup group) {
        if (canAccessGroup(user, group)) {
            return;
        }
        throw new AccessDeniedException("This capstone group is outside the current user's permission scope.");
    }

    public boolean canAccessGroup(UserAccount user, CapstoneGroup group) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        if (user.getRole() == Role.ADVISER) {
            return group.getAdviser() != null && group.getAdviser().getId().equals(user.getId());
        }
        return groupMembers.findByStudent(user)
                .map(GroupMember::getGroup)
                .map(ownGroup -> ownGroup.getId().equals(group.getId()))
                .orElse(false);
    }
}
