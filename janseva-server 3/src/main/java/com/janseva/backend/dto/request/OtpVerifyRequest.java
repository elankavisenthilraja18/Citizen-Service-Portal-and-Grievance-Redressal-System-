package com.janseva.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(
        @NotBlank(message = "Identifier is required")
        String identifier,

        @NotBlank(message = "OTP is required")
        String otp
) {
}
