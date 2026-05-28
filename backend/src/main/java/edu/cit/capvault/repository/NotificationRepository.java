package edu.cit.capvault.repository;

import edu.cit.capvault.domain.Notification;
import edu.cit.capvault.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(UserAccount user);

    long countByUserAndReadAtIsNull(UserAccount user);
}
