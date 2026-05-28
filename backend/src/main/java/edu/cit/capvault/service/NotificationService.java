package edu.cit.capvault.service;

import edu.cit.capvault.domain.Notification;
import edu.cit.capvault.domain.NotificationType;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final DtoMapper mapper;

    public NotificationService(NotificationRepository notifications, DtoMapper mapper) {
        this.notifications = notifications;
        this.mapper = mapper;
    }

    @Transactional
    public void notify(UserAccount user, NotificationType type, String title, String message, String link) {
        notifications.save(new Notification(user, type, title, message, link));
    }

    public List<CapVaultDtos.NotificationDto> forUser(UserAccount user) {
        return notifications.findByUserOrderByCreatedAtDesc(user).stream().map(mapper::notification).toList();
    }

    public long unreadCount(UserAccount user) {
        return notifications.countByUserAndReadAtIsNull(user);
    }

    @Transactional
    public CapVaultDtos.NotificationDto markRead(UserAccount user, Long id) {
        Notification notification = notifications.findById(id)
                .filter(item -> item.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        notification.markRead();
        return mapper.notification(notification);
    }
}
