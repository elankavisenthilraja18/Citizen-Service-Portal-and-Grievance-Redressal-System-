package com.janseva.backend.util;

import com.janseva.backend.enums.Role;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Generates the human-readable IDs shown throughout the portal:
 *  - Employee ID:      VAO20260015
 *  - Application ID:   CS2025000123
 *  - Grievance ID:      GR2025000456
 *  - Certificate No:   TN/CS2025000123
 *  - Temporary password: Temp@4589
 */
@Component
public class IdGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    // In-memory running counters used as a fallback/seed; in production these
    // would be backed by a DB sequence per role/year to guarantee uniqueness.
    private final AtomicLong applicationCounter = new AtomicLong(100000);
    private final AtomicLong grievanceCounter = new AtomicLong(100000);
    private final AtomicLong officerCounter = new AtomicLong(1);

    private String roleCode(Role role) {
        return switch (role) {
            case VAO -> "VAO";
            case RI -> "RI";
            case TAHSILDAR -> "TAH";
            case DEPARTMENT_OFFICER -> "DPT";
            case FIELD_OFFICER -> "FLD";
            case GRIEVANCE_OFFICER -> "GRO";
            case ADMINISTRATOR -> "ADM";
            case CITIZEN -> "CIT";
        };
    }

    /** e.g. VAO20260015 */
    public String generateEmployeeId(Role role) {
        int year = Year.now().getValue();
        long seq = officerCounter.getAndIncrement();
        return String.format("%s%d%04d", roleCode(role), year, seq);
    }

    /** e.g. CS2025000123 */
    public String generateApplicationId() {
        int year = Year.now().getValue();
        long seq = applicationCounter.getAndIncrement();
        return String.format("CS%d%06d", year, seq);
    }

    /** e.g. GR2025000456 */
    public String generateGrievanceId() {
        int year = Year.now().getValue();
        long seq = grievanceCounter.getAndIncrement();
        return String.format("GR%d%06d", year, seq);
    }

    /** e.g. TN/CS2025000123 */
    public String generateCertificateNumber(String applicationId) {
        return "TN/" + applicationId;
    }

    /** e.g. Temp@4589 - a random temporary password sent on officer creation. */
    public String generateTemporaryPassword() {
        int number = 1000 + RANDOM.nextInt(9000);
        return "Temp@" + number;
    }

    /** 6-digit numeric OTP for 2FA / mobile verification. */
    public String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
