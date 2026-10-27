package com.janseva.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String id;
    private String name;
    private String role;
    private String employeeId;   // officers only
    private boolean firstLogin;  // officers only
    private boolean otpRequired; // true for a two-step official login
}
