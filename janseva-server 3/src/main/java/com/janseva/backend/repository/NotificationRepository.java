package com.janseva.backend.repository;

import com.janseva.backend.enums.RecipientType;
import com.janseva.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientTypeAndRecipientIdOrderBySentAtDesc(RecipientType type, UUID recipientId);
}
