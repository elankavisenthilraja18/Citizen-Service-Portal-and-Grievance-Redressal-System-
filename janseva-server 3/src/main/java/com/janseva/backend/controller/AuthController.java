package com.janseva.backend.controller;

import com.janseva.backend.dto.request.*;
import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.dto.response.JwtResponse;
import com.janseva.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<JwtResponse>> register(@Valid @RequestBody RegisterCitizenRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Account created successfully", authService.registerCitizen(req)));
    }

    @PostMapping("/login/citizen")
    public ResponseEntity<ApiResponse<JwtResponse>> loginCitizen(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authService.loginCitizen(req)));
    }

    /** SRS FR1: account recovery via time-limited OTP. Always returns a generic success message. */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(ApiResponse.ok(
                "If an account exists for that mobile number or email, an OTP has been sent.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. Please log in.", null));
    }

    /** Step 1: Employee ID + password -> OTP is sent (SMS/Email, logged to console in this demo). */
    @PostMapping("/login/officer/step1")
    public ResponseEntity<ApiResponse<String>> officerLoginStep1(@Valid @RequestBody LoginRequest req) {
        String employeeId = authService.officerLoginStep1(req);
        return ResponseEntity.ok(ApiResponse.ok("OTP sent to registered mobile number", employeeId));
    }

    /** Step 2: OTP verification -> JWT issued (firstLogin flag tells the client whether to force a password change). */
    @PostMapping("/login/officer/verify-otp")
    public ResponseEntity<ApiResponse<JwtResponse>> officerVerifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("OTP verified", authService.verifyOfficerOtp(req)));
    }

    /** Mandatory on first login; also usable as a general "forgot password after reset" flow. */
    @PostMapping("/officer/change-password")
    public ResponseEntity<ApiResponse<Void>> changeOfficerPassword(@Valid @RequestBody ChangePasswordRequest req) {
        authService.changeOfficerPassword(req);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", null));
    }

    /**
     * Logs out the current session by blacklisting its token (SRS Appendix D:
     * "Token Blacklisting: implemented for logout, password change, and
     * security breaches"). Requires a valid Authorization header, since
     * /api/auth/logout is not in the public-endpoints list.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            authService.logout(header.substring(7));
        }
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }
}