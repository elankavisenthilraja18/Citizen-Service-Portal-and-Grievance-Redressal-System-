package com.janseva.backend.enums;

/**
 * Mirrors the workflow:
 * Submitted -> Viewed -> Under Verification -> VAO Approved -> RI Approved
 * -> Tahsildar Approved -> Certificate Ready   (or -> Rejected at any verification step)
 */
public enum ApplicationStatus {
    SUBMITTED,
    VIEWED,
    UNDER_VERIFICATION,
    VAO_APPROVED,
    RI_APPROVED,
    TAHSILDAR_APPROVED,
    CERTIFICATE_READY,
    REJECTED
}
