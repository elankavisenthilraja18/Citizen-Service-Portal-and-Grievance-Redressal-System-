package com.janseva.backend.dto.request;

public record ApplicationDecisionRequest(
        String remarks,
        /** Required only when rejecting. */
        String rejectionReason
) {
}
