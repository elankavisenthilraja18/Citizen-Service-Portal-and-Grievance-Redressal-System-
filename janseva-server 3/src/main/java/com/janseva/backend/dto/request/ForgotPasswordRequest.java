package com.janseva.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Mobile number or email is required")
        String identifier
) {
}