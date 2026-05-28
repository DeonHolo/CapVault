package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.CalendarService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {
    private final CalendarService calendar;
    private final CurrentUserService currentUser;

    public CalendarController(CalendarService calendar, CurrentUserService currentUser) {
        this.calendar = calendar;
        this.currentUser = currentUser;
    }

    @GetMapping("/deadlines")
    public List<CapVaultDtos.DeadlineDto> deadlines() {
        return calendar.deadlinesFor(currentUser.requireCurrentUser());
    }

    @PostMapping("/deadlines")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.DeadlineDto createDeadline(@Valid @RequestBody CapVaultDtos.DeadlineRequest request) {
        return calendar.createDeadline(currentUser.requireCurrentUser(), request);
    }

    @GetMapping("/announcements")
    public List<CapVaultDtos.AnnouncementDto> announcements() {
        return calendar.announcementsFor(currentUser.requireCurrentUser());
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public CapVaultDtos.AnnouncementDto createAnnouncement(@Valid @RequestBody CapVaultDtos.AnnouncementRequest request) {
        return calendar.createAnnouncement(currentUser.requireCurrentUser(), request);
    }
}
