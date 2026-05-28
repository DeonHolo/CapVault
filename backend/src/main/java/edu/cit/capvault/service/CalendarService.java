package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class CalendarService {
    private final DeadlineRepository deadlines;
    private final AnnouncementRepository announcements;
    private final DeliverableRepository deliverables;
    private final CapstoneGroupRepository groups;
    private final NotificationService notificationService;
    private final UserAccountRepository users;
    private final AccessControlService accessControl;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;

    public CalendarService(DeadlineRepository deadlines, AnnouncementRepository announcements, DeliverableRepository deliverables, CapstoneGroupRepository groups, NotificationService notificationService, UserAccountRepository users, AccessControlService accessControl, ActivityLogService activityLog, DtoMapper mapper) {
        this.deadlines = deadlines;
        this.announcements = announcements;
        this.deliverables = deliverables;
        this.groups = groups;
        this.notificationService = notificationService;
        this.users = users;
        this.accessControl = accessControl;
        this.activityLog = activityLog;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CapVaultDtos.DeadlineDto> deadlinesFor(UserAccount user) {
        List<Deadline> candidates = user.getRole() == Role.ADMIN
                ? deadlines.findByActiveTrueOrderByDueAtAsc()
                : deadlines.findByTargetRoleInOrTargetRoleIsNullOrderByDueAtAsc(List.of(user.getRole()));
        return candidates.stream()
                .filter(deadline -> canSeeDeadline(user, deadline))
                .map(mapper::deadline)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CapVaultDtos.AnnouncementDto> announcementsFor(UserAccount user) {
        List<Announcement> candidates = user.getRole() == Role.ADMIN
                ? announcements.findAllByOrderByPublishedAtDesc()
                : announcements.findByTargetRoleInOrTargetRoleIsNullOrderByPublishedAtDesc(List.of(user.getRole()));
        return candidates.stream().map(mapper::announcement).toList();
    }

    @Transactional
    public CapVaultDtos.DeadlineDto createDeadline(UserAccount actor, CapVaultDtos.DeadlineRequest request) {
        Deliverable deliverable = request.deliverableId() == null ? null : deliverables.findById(request.deliverableId()).orElseThrow(() -> new IllegalArgumentException("Deliverable not found."));
        CapstoneGroup group = request.groupId() == null ? null : groups.findById(request.groupId()).orElseThrow(() -> new IllegalArgumentException("Group not found."));
        Deadline deadline = deadlines.save(new Deadline(request.title(), request.description(), request.dueAt(), deliverable, group, request.targetRole()));
        users.findAll().stream()
                .filter(user -> request.targetRole() == null || user.getRole() == request.targetRole())
                .filter(user -> group == null || accessControl.canAccessGroup(user, group))
                .forEach(user -> notificationService.notify(user, NotificationType.DEADLINE, "Deadline posted", request.title() + " is due on " + request.dueAt() + ".", "/calendar"));
        activityLog.record(actor, "DEADLINE_CREATED", "Deadline", deadline.getId(), request.title() + " was scheduled.");
        return mapper.deadline(deadline);
    }

    @Transactional
    public CapVaultDtos.AnnouncementDto createAnnouncement(UserAccount actor, CapVaultDtos.AnnouncementRequest request) {
        Announcement announcement = announcements.save(new Announcement(request.title(), request.body(), request.targetRole(), Instant.now(), request.expiresAt(), actor));
        users.findAll().stream()
                .filter(user -> request.targetRole() == null || user.getRole() == request.targetRole())
                .forEach(user -> notificationService.notify(user, NotificationType.ANNOUNCEMENT, request.title(), request.body(), "/notifications"));
        activityLog.record(actor, "ANNOUNCEMENT_CREATED", "Announcement", announcement.getId(), request.title() + " was published.");
        return mapper.announcement(announcement);
    }

    private boolean canSeeDeadline(UserAccount user, Deadline deadline) {
        if (!deadline.isActive()) {
            return false;
        }
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        if (deadline.getTargetRole() != null && deadline.getTargetRole() != user.getRole()) {
            return false;
        }
        return deadline.getGroup() == null || accessControl.canAccessGroup(user, deadline.getGroup());
    }
}
