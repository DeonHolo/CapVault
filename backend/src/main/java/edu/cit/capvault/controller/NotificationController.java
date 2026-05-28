package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifications;
    private final CurrentUserService currentUser;

    public NotificationController(NotificationService notifications, CurrentUserService currentUser) {
        this.notifications = notifications;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<CapVaultDtos.NotificationDto> list() {
        return notifications.forUser(currentUser.requireCurrentUser());
    }

    @PatchMapping("/{id}/read")
    public CapVaultDtos.NotificationDto read(@PathVariable Long id) {
        return notifications.markRead(currentUser.requireCurrentUser(), id);
    }
}
