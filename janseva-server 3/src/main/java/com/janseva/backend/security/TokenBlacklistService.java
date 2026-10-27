package com.janseva.backend.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist (SRS Appendix D: "Token Blacklisting: implemented
 * for logout, password change, and security breaches"). Stores the raw token
 * string against its expiry so entries can be swept once they'd have expired
 * naturally anyway - keeps the map bounded without needing a scheduled job.
 *
 * Simplified for a single-instance demo deployment: a production/multi-instance
 * deployment would back this with a shared store (Redis) keyed by JWT id (jti)
 * rather than the full token string.
 */
@Component
public class TokenBlacklistService {

    private final Map<String, Instant> blacklisted = new ConcurrentHashMap<>();

    public void blacklist(String token, Instant expiry) {
        sweep();
        blacklisted.put(token, expiry);
    }

    public boolean isBlacklisted(String token) {
        return blacklisted.containsKey(token);
    }

    private void sweep() {
        Instant now = Instant.now();
        blacklisted.entrySet().removeIf(e -> e.getValue().isBefore(now));
    }
}