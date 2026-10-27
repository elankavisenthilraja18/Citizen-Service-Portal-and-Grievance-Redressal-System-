package com.janseva.backend.dto.request;

import com.janseva.backend.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

/**
 * Used only by an ADMINISTRATOR to onboard a new government officer.
 * The system auto-generates the Employee ID and a temporary password;
 * neither is accepted from the client.
 */
public record CreateOfficerRequest(
        @NotBlank(message = "Officer name is required")
        @Pattern(regexp = "^[A-Za-z ]{2,100}$", message = "Name must not contain numbers or special characters")
        String name,

        String email,

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "\\d{10}", message = "Phone Number must be exactly 10 digits long")
        String phone,

        @NotNull(message = "Role is required")
        Role role,

        @NotNull(message = "Department is required")
        UUID departmentId,

        String district,
        String taluk,
        String ward,
        String officeAddress
) {
}