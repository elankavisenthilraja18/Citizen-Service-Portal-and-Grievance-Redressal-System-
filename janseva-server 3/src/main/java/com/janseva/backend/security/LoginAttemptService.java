package com.janseva.backend.security;

import com.janseva.backend.exception.UnauthorizedException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tracks failed login attempts per identifier (mobile/email/employeeId) and
 * locks that identifier out for a period after too many failures, per SRS
 * FR2 ("Progressive lockout: 15, 30, 1440 minutes after 5, 10, 15 failures")
 * and Appendix D ("Lockout 15 minutes after 5 consecutive failed attempts").
 *
 * Simplified for a single-instance demo deployment: state is in-memory
 * (a Redis- or DB-backed store would be needed across multiple instances)
 * and only the first lockout tier is enforced. The structure is in place to
 * add the 30- and 1440-minute tiers by keying off failureCount ranges.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private static class Record {
        final AtomicInteger failureCount = new AtomicInteger(0);
        volatile Instant lockedUntil = null;
    }

    private final ConcurrentHashMap<String, Record> attempts = new ConcurrentHashMap<>();

    /** Call before attempting authentication; throws if the identifier is currently locked. */
    public void assertNotLocked(String identifier) {
        Record record = attempts.get(key(identifier));
        if (record != null && record.lockedUntil != null) {
            if (Instant.now().isBefore(record.lockedUntil)) {
                long minutesLeft = Math.max(1, Duration.between(Instant.now(), record.lockedUntil).toMinutes());
                throw new UnauthorizedException(
                        "Too many failed login attempts. Please try again in " + minutesLeft + " minute(s).");
            }
            // lock period has elapsed - reset
            attempts.remove(key(identifier));
        }
    }

    public void recordFailure(String identifier) {
        Record record = attempts.computeIfAbsent(key(identifier), k -> new Record());
        int count = record.failureCount.incrementAndGet();
        if (count >= MAX_ATTEMPTS) {
            record.lockedUntil = Instant.now().plus(LOCK_DURATION);
        }
    }

    public void recordSuccess(String identifier) {
        attempts.remove(key(identifier));
    }

    private String key(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase();
    }
}