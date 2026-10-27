package com.janseva.backend.service;

import com.janseva.backend.util.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal OTP store for demo/portfolio purposes. In production this would be
 * backed by Redis (with TTL) rather than an in-memory map, and would call a
 * real SMS/email gateway instead of just logging the OTP.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final long OTP_TTL_SECONDS = 300; // 5 minutes (login OTP)
    private static final long RESET_OTP_TTL_SECONDS = 900; // 15 minutes (SRS Appendix D: account recovery OTP)

    private record OtpEntry(String code, Instant expiresAt) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final IdGenerator idGenerator;
    private final NotificationService notificationService;

    /** Generates and "sends" (logs) an OTP for the given identifier (mobile/employeeId). */
    public String issueOtp(String identifier) {
        return issueOtp(identifier, OTP_TTL_SECONDS);
    }

    /** Same as {@link #issueOtp(String)} but with a caller-chosen validity window. */
    public String issueOtp(String identifier, long ttlSeconds) {
        String otp = idGenerator.generateOtp();
        store.put(identifier, new OtpEntry(otp, Instant.now().plusSeconds(ttlSeconds)));
        notificationService.log("OTP_ISSUED", identifier,
                "Your JanSeva OTP is " + otp + ". It is valid for " + (ttlSeconds / 60) + " minutes.");
        return otp;
    }

    public boolean verifyOtp(String identifier, String otp) {
        OtpEntry entry = store.get(identifier);
        if (entry == null) return false;
        boolean valid = entry.code().equals(otp) && Instant.now().isBefore(entry.expiresAt());
        if (valid) store.remove(identifier);
        return valid;
    }
}