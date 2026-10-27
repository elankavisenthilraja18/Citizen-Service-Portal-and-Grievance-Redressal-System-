package com.janseva.backend.security;

import com.janseva.backend.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${janseva.security.jwt-secret}")
    private String jwtSecret;

    /** Fallback expiry (ms) used only if a role isn't one of the tiers below. */
    @Value("${janseva.security.jwt-expiration-ms}")
    private long jwtExpirationMs;

    // Role-tiered session length, per SRS Appendix D:
    // "Login < 8 hours for regular users, 12 hours for staff, 24 hours for admins".
    private static final long CITIZEN_EXPIRY_MS = 8L * 60 * 60 * 1000;
    private static final long STAFF_EXPIRY_MS = 12L * 60 * 60 * 1000;
    private static final long ADMIN_EXPIRY_MS = 24L * 60 * 60 * 1000;

    private SecretKey signingKey() {
        // jwt-secret is a base64-encoded 256-bit+ string (see application.properties)
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private long expiryForRole(String role) {
        try {
            Role r = Role.valueOf(role);
            if (r == Role.CITIZEN) return CITIZEN_EXPIRY_MS;
            if (r == Role.ADMINISTRATOR) return ADMIN_EXPIRY_MS;
            return STAFF_EXPIRY_MS; // VAO/RI/TAHSILDAR/DEPARTMENT_OFFICER/FIELD_OFFICER/GRIEVANCE_OFFICER
        } catch (IllegalArgumentException e) {
            return jwtExpirationMs;
        }
    }

    public String generateToken(String subjectId, String role, Map<String, Object> extraClaims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiryForRole(role));
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subjectId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey()) // algorithm inferred from the HMAC key (HS256 for a 256+ bit key)
                .compact();
    }

    public Date extractExpirationPublic(String token) {
        return extractExpiration(token);
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            return !extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}