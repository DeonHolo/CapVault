package edu.cit.capvault.service;

import edu.cit.capvault.domain.CapstoneGroup;
import edu.cit.capvault.domain.Deliverable;
import edu.cit.capvault.domain.Role;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.CapstoneGroupRepository;
import edu.cit.capvault.repository.DeliverableRepository;
import edu.cit.capvault.repository.GroupMemberRepository;
import edu.cit.capvault.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class GroupService {
    private final CapstoneGroupRepository groups;
    private final UserAccountRepository users;
    private final DeliverableRepository deliverables;
    private final GroupMemberRepository groupMembers;
    private final AccessControlService accessControl;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;

    public GroupService(CapstoneGroupRepository groups, UserAccountRepository users, DeliverableRepository deliverables, GroupMemberRepository groupMembers, AccessControlService accessControl, ActivityLogService activityLog, DtoMapper mapper) {
        this.groups = groups;
        this.users = users;
        this.deliverables = deliverables;
        this.groupMembers = groupMembers;
        this.accessControl = accessControl;
        this.activityLog = activityLog;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CapVaultDtos.GroupDto> list(UserAccount currentUser) {
        List<CapstoneGroup> visible = switch (currentUser.getRole()) {
            case ADMIN -> groups.findAllByOrderByTeamCodeAsc();
            case ADVISER -> groups.findByAdviserOrderByTeamCodeAsc(currentUser);
            case STUDENT -> groupMembers.findByStudent(currentUser).map(member -> List.of(member.getGroup())).orElse(List.of());
        };
        return visible.stream().map(mapper::group).toList();
    }

    @Transactional(readOnly = true)
    public CapVaultDtos.GroupDto get(UserAccount currentUser, Long id) {
        CapstoneGroup group = groups.findById(id).orElseThrow(() -> new IllegalArgumentException("Group not found."));
        accessControl.requireGroupAccess(currentUser, group);
        return mapper.group(group);
    }

    @Transactional
    public CapVaultDtos.GroupDto upsert(UserAccount actor, Long id, CapVaultDtos.GroupRequest request) {
        CapstoneGroup group = id == null
                ? groups.findByTeamCodeIgnoreCase(request.teamCode()).orElse(null)
                : groups.findById(id).orElseThrow(() -> new IllegalArgumentException("Group not found."));
        UserAccount adviser = request.adviserEmail() == null || request.adviserEmail().isBlank()
                ? null
                : users.findByEmailIgnoreCase(request.adviserEmail())
                .filter(user -> user.getRole() == Role.ADVISER)
                .orElseThrow(() -> new IllegalArgumentException("Adviser account not found."));
        if (group == null) {
            group = new CapstoneGroup(request.teamCode(), request.projectTitle(), request.softwareName(), request.description(), request.section(), request.category(), adviser);
        } else {
            group.setTeamCode(request.teamCode());
            group.setProjectTitle(request.projectTitle());
            group.setSoftwareName(request.softwareName());
            group.setDescription(request.description());
            group.setSection(request.section());
            group.setCategory(request.category());
            group.setAdviser(adviser);
        }
        CapstoneGroup saved = groups.save(group);
        activityLog.record(actor, "GROUP_SAVED", "CapstoneGroup", saved.getId(), saved.getTeamCode() + " was saved.");
        return mapper.group(saved);
    }

    @Transactional
    public CapVaultDtos.DeliverableDto createDeliverable(UserAccount actor, CapVaultDtos.DeliverableRequest request) {
        CapstoneGroup group = request.groupId() == null ? null : groups.findById(request.groupId()).orElseThrow(() -> new IllegalArgumentException("Group not found."));
        Instant dueAt = request.dueAt();
        Deliverable deliverable = new Deliverable(request.title(), request.milestoneKey(), request.description(), dueAt, group);
        Deliverable saved = deliverables.save(deliverable);
        activityLog.record(actor, "DELIVERABLE_SAVED", "Deliverable", saved.getId(), saved.getTitle() + " was saved.");
        return mapper.deliverable(saved);
    }
}
