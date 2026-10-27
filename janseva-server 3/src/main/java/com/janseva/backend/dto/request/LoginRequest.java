package com.janseva.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * identifier = citizen's email/mobile, OR an officer's employeeId.
 */
public record LoginRequest(
        @NotBlank(message = "Identifier is required")
        String identifier,

        @NotBlank(message = "Password is required")
        String password
) {
}
