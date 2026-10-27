package com.janseva.backend.dto.request;

import java.util.UUID;

public record ReassignGrievanceRequest(
        UUID departmentId,
        UUID fieldOfficerId,
        String remarks
) {
}
