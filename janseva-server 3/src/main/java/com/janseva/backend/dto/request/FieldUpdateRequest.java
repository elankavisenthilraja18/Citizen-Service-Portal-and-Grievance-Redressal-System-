package com.janseva.backend.dto.request;

import java.time.LocalDate;

public record FieldUpdateRequest(
        String remarks,
        String photoUrl,
        LocalDate expectedCompletionDate,
        boolean markResolved
) {
}
