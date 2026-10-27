package com.janseva.backend.service;

import com.janseva.backend.enums.NotificationChannel;
import com.janseva.backend.enums.NotificationStatus;
import com.janseva.backend.enums.RecipientType;
import com.janseva.backend.model.Notification;
import com.janseva.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Sends Email / SMS / In-App notifications for every key portal event.
 * Real gateway integration (e.g. Twilio, SES) can be dropped into
 * dispatch() without touching any calling code.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** Quick-log helper used before we have a recipient UUID (e.g. OTPs keyed by identifier). */
    public void log(String eventType, String identifier, String message) {
        log.info("[NOTIFY] event={} to={} message={}", eventType, identifier, message);
    }

    @Async
    public void notifyCitizen(UUID citizenId, String eventType, String message, NotificationChannel channel) {
        send(RecipientType.CITIZEN, citizenId, eventType, message, channel);
    }

    @Async
    public void notifyOfficer(UUID officerId, String eventType, String message, NotificationChannel channel) {
        send(RecipientType.OFFICER, officerId, eventType, message, channel);
    }

    /** Fires all three channels for a citizen-facing event, matching the portal spec. */
    public void notifyCitizenAllChannels(UUID citizenId, String eventType, String message) {
        for (NotificationChannel c : NotificationChannel.values()) {
            send(RecipientType.CITIZEN, citizenId, eventType, message, c);
        }
    }

    private void send(RecipientType type, UUID recipientId, String eventType, String message, NotificationChannel channel) {
        Notification n = Notification.builder()
                .recipientType(type)
                .recipientId(recipientId)
                .channel(channel)
                .eventType(eventType)
                .message(message)
                .status(NotificationStatus.SENT) // simulated delivery succeeds
                .build();
        notificationRepository.save(n);
        log.info("[NOTIFY:{}] to={} ({}) event={} message={}", channel, recipientId, type, eventType, message);
    }

    public List<Notification> listFor(RecipientType type, UUID recipientId) {
        return notificationRepository.findByRecipientTypeAndRecipientIdOrderBySentAtDesc(type, recipientId);
    }
}
