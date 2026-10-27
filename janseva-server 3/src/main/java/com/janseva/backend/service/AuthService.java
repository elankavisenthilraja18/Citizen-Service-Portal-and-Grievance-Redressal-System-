package com.janseva.backend.service;

import com.janseva.backend.dto.request.ChangePasswordRequest;
import com.janseva.backend.dto.request.ForgotPasswordRequest;
import com.janseva.backend.dto.request.LoginRequest;
import com.janseva.backend.dto.request.OtpVerifyRequest;
import com.janseva.backend.dto.request.RegisterCitizenRequest;
import com.janseva.backend.dto.request.ResetPasswordRequest;
import com.janseva.backend.dto.response.JwtResponse;
import com.janseva.backend.enums.AccountStatus;
import com.janseva.backend.enums.NotificationChannel;
import com.janseva.backend.enums.Role;
import com.janseva.backend.exception.BadRequestException;
import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.exception.UnauthorizedException;
import com.janseva.backend.model.Citizen;
import com.janseva.backend.model.Officer;
import com.janseva.backend.repository.CitizenRepository;
import com.janseva.backend.repository.OfficerRepository;
import com.janseva.backend.security.JwtUtil;
import com.janseva.backend.security.LoginAttemptService;
import com.janseva.backend.security.TokenBlacklistService;
import com.janseva.backend.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CitizenRepository citizenRepository;
    private final OfficerRepository officerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final NotificationService notificationService;
    private final LoginAttemptService loginAttemptService;
    private final TokenBlacklistService tokenBlacklistService;

    // ---------------------------------------------------------- Citizens

    @Transactional
    public JwtResponse registerCitizen(RegisterCitizenRequest req) {
        // SRS Appendix C: name alphabetic-only, phone exactly 10 digits;
        // Appendix D: password complexity (8+ chars, upper/lower/digit/special).
        InputValidator.validateName(req.fullName());
        InputValidator.validatePhone(req.mobile());
        if (!InputValidator.isStrongPassword(req.password())) {
            throw new BadRequestException(
                    "Password must be at least 8 characters and include an uppercase letter, "
                            + "a lowercase letter, a digit, and a special character");
        }
        if (citizenRepository.existsByMobile(req.mobile())) {
            throw new BadRequestException("Mobile number is already registered");
        }
        if (req.email() != null && !req.email().isBlank() && citizenRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email is already registered");
        }

        Citizen citizen = Citizen.builder()
                .fullName(req.fullName())
                .mobile(req.mobile())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .district(req.district())
                .ward(req.ward())
                .languagePreference(req.languagePreference() == null ? "en" : req.languagePreference())
                .status(AccountStatus.ACTIVE)
                .build();
        citizen = citizenRepository.save(citizen);

        notificationService.notifyCitizenAllChannels(citizen.getCitizenId(), "ACCOUNT_CREATED",
                "Welcome to JanSeva, " + citizen.getFullName() + "! Your account is ready.");

        String token = jwtUtil.generateToken(citizen.getCitizenId().toString(), Role.CITIZEN.name(), Map.of());
        return JwtResponse.builder()
                .token(token)
                .id(citizen.getCitizenId().toString())
                .name(citizen.getFullName())
                .role(Role.CITIZEN.name())
                .otpRequired(false)
                .build();
    }

    public JwtResponse loginCitizen(LoginRequest req) {
        // SRS FR2: progressive lockout after repeated failed attempts.
        loginAttemptService.assertNotLocked(req.identifier());

        Citizen citizen = citizenRepository.findByEmailOrMobile(req.identifier(), req.identifier())
                .orElse(null);

        if (citizen == null || !passwordEncoder.matches(req.password(), citizen.getPasswordHash())) {
            loginAttemptService.recordFailure(req.identifier());
            throw new UnauthorizedException("Invalid credentials");
        }
        if (citizen.getStatus() == AccountStatus.INACTIVE) {
            throw new UnauthorizedException("This account has been deactivated");
        }
        loginAttemptService.recordSuccess(req.identifier());

        String token = jwtUtil.generateToken(citizen.getCitizenId().toString(), Role.CITIZEN.name(), Map.of());
        return JwtResponse.builder()
                .token(token)
                .id(citizen.getCitizenId().toString())
                .name(citizen.getFullName())
                .role(Role.CITIZEN.name())
                .otpRequired(false)
                .build();
    }

    // ---------------------------------------------------------- Officers

    /**
     * SRS FR1: "Account recovery uses time-limited email OTP with 15-minute
     * validity window." Always returns the same generic message whether or
     * not the identifier matches an account, so the response itself can't be
     * used to enumerate registered mobiles/emails - the OTP is only actually
     * issued when a matching citizen exists.
     */
    public void forgotPassword(ForgotPasswordRequest req) {
        citizenRepository.findByEmailOrMobile(req.identifier(), req.identifier())
                .ifPresent(citizen -> {
                    otpService.issueOtp(citizen.getMobile(), 900); // 15 minutes
                    NotificationChannel channel = citizen.getEmail() != null && !citizen.getEmail().isBlank()
                            ? NotificationChannel.EMAIL : NotificationChannel.SMS;
                    notificationService.notifyCitizen(citizen.getCitizenId(), "PASSWORD_RESET_OTP",
                            "An OTP to reset your JanSeva password has been sent. It is valid for 15 minutes.",
                            channel);
                });
        // Deliberately no branch here for "account not found" - same response either way.
    }

    /** Completes the forgot-password flow: verifies the OTP and sets the new password. */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        if (!req.newPassword().equals(req.confirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }
        if (!InputValidator.isStrongPassword(req.newPassword())) {
            throw new BadRequestException(
                    "Password must be at least 8 characters and include an uppercase letter, "
                            + "a lowercase letter, a digit, and a special character");
        }
        Citizen citizen = citizenRepository.findByEmailOrMobile(req.identifier(), req.identifier())
                .orElseThrow(() -> new UnauthorizedException("Invalid OTP or account"));

        // OTPs are always issued keyed by mobile (see forgotPassword above), regardless
        // of whether the citizen typed their email or mobile as the identifier.
        if (!otpService.verifyOtp(citizen.getMobile(), req.otp())) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        citizen.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        citizenRepository.save(citizen);

        notificationService.notifyCitizenAllChannels(citizen.getCitizenId(), "PASSWORD_RESET",
                "Your JanSeva password was reset successfully. If this wasn't you, contact support immediately.");
    }

    /**
     * Step 1 of officer login: verify Employee ID + password, then issue an OTP.
     * The officer is NOT authenticated yet - the client must call verifyOfficerOtp next.
     */
    public String officerLoginStep1(LoginRequest req) {
        loginAttemptService.assertNotLocked(req.identifier());

        Officer officer = officerRepository.findByEmployeeId(req.identifier()).orElse(null);

        if (officer == null || !passwordEncoder.matches(req.password(), officer.getPasswordHash())) {
            loginAttemptService.recordFailure(req.identifier());
            throw new UnauthorizedException("Invalid Employee ID or password");
        }
        if (!officer.isActive()) {
            throw new UnauthorizedException("This officer account has been deactivated");
        }
        loginAttemptService.recordSuccess(req.identifier());

        otpService.issueOtp(officer.getEmployeeId());
        notificationService.notifyOfficer(officer.getOfficerId(), "LOGIN_OTP",
                "An OTP has been sent for your JanSeva login.", NotificationChannel.SMS);
        return officer.getEmployeeId();
    }

    /**
     * Step 2 of officer login: verify OTP and issue a JWT. If this is the officer's
     * first login, the token is still issued but firstLogin=true so the client can
     * force a mandatory password change before granting dashboard access.
     */
    @Transactional
    public JwtResponse verifyOfficerOtp(OtpVerifyRequest req) {
        if (!otpService.verifyOtp(req.identifier(), req.otp())) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }
        Officer officer = officerRepository.findByEmployeeId(req.identifier())
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        String token = jwtUtil.generateToken(officer.getOfficerId().toString(), officer.getRole().name(), Map.of());
        return JwtResponse.builder()
                .token(token)
                .id(officer.getOfficerId().toString())
                .name(officer.getName())
                .role(officer.getRole().name())
                .employeeId(officer.getEmployeeId())
                .firstLogin(officer.isFirstLogin())
                .otpRequired(false)
                .build();
    }

    /** Mandatory on an officer's first login before they can use the dashboard. */
    @Transactional
    public void changeOfficerPassword(ChangePasswordRequest req) {
        if (!req.newPassword().equals(req.confirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }
        if (!InputValidator.isStrongPassword(req.newPassword())) {
            throw new BadRequestException(
                    "Password must be at least 8 characters and include an uppercase letter, "
                            + "a lowercase letter, a digit, and a special character");
        }
        Officer officer = officerRepository.findByEmployeeId(req.identifier())
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        officer.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        officer.setFirstLogin(false);
        officerRepository.save(officer);

        notificationService.notifyOfficer(officer.getOfficerId(), "PASSWORD_CHANGED",
                "Your JanSeva password was changed successfully.", NotificationChannel.EMAIL);
    }

    /**
     * Blacklists the current session's token (SRS Appendix D: "Token Blacklisting:
     * implemented for logout, password change, and security breaches"). The token
     * remains blacklisted until its own expiry, at which point it would be
     * rejected as expired anyway.
     */
    public void logout(String token) {
        tokenBlacklistService.blacklist(token, jwtUtil.extractExpirationPublic(token).toInstant());
    }
}