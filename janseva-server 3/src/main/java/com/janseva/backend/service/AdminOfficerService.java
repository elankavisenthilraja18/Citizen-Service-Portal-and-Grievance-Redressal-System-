package com.janseva.backend.service;

import com.janseva.backend.dto.request.CreateOfficerRequest;
import com.janseva.backend.dto.response.OfficerCreatedResponse;
import com.janseva.backend.enums.NotificationChannel;
import com.janseva.backend.enums.Role;
import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.exception.BadRequestException;
import com.janseva.backend.model.Department;
import com.janseva.backend.model.Officer;
import com.janseva.backend.repository.DepartmentRepository;
import com.janseva.backend.repository.OfficerRepository;
import com.janseva.backend.util.IdGenerator;
import com.janseva.backend.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implements the "Government Officer Account Creation Module":
 * Administrator Login -> Officer Management -> Create New Officer -> ...
 * -> Generate Employee ID -> Generate Temporary Password -> Save -> Email + SMS sent.
 */
@Service
@RequiredArgsConstructor
public class AdminOfficerService {

    private final OfficerRepository officerRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final IdGenerator idGenerator;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public OfficerCreatedResponse createOfficer(CreateOfficerRequest req, Officer admin) {
        InputValidator.validateName(req.name());
        InputValidator.validatePhone(req.phone());

        Department department = departmentRepository.findById(req.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        validateJurisdiction(req, department, null);

        String employeeId = idGenerator.generateEmployeeId(req.role());
        while (officerRepository.existsByEmployeeId(employeeId)) {
            employeeId = idGenerator.generateEmployeeId(req.role());
        }
        String tempPassword = idGenerator.generateTemporaryPassword();

        Officer officer = Officer.builder()
                .employeeId(employeeId)
                .name(req.name())
                .email(req.email())
                .phone(req.phone())
                .role(req.role())
                .department(department)
                .district(req.district())
                .taluk(req.taluk())
                .ward(req.ward())
                .officeAddress(req.officeAddress())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .firstLogin(true)
                .isActive(true)
                .createdBy(admin)
                .build();
        officer = officerRepository.save(officer);

        String emailBody = "Dear " + officer.getName() + ",\n\n" +
                "Your government officer account has been created successfully.\n\n" +
                "Employee ID: " + employeeId + "\n" +
                "Temporary Password: " + tempPassword + "\n\n" +
                "Please log in using these credentials. For security reasons, you must verify your " +
                "identity using OTP and change your password during your first login.\n\n" +
                "Regards,\nJanSeva Administration";

        String smsBody = "JanSeva: Your account is ready. Employee ID: " + employeeId +
                " | Temporary Password: " + tempPassword + ". Login and change your password after OTP verification.";

        notificationService.notifyOfficer(officer.getOfficerId(), "OFFICER_ACCOUNT_CREATED", emailBody, NotificationChannel.EMAIL);
        notificationService.notifyOfficer(officer.getOfficerId(), "OFFICER_ACCOUNT_CREATED", smsBody, NotificationChannel.SMS);

        auditLogService.record(admin, "OFFICER_CREATED", "Officer", officer.getOfficerId(),
                "Created " + req.role() + " account " + employeeId + " for " + req.name());

        return OfficerCreatedResponse.builder()
                .officerId(officer.getOfficerId())
                .employeeId(employeeId)
                .temporaryPassword(tempPassword)
                .name(officer.getName())
                .role(officer.getRole().name())
                .emailPreview(emailBody)
                .smsPreview(smsBody)
                .build();
    }

    /**
     * Keeps grievance ownership deterministic:
     * - one Department Officer per department
     * - one active Field Officer per department + ward
     */
    private void validateJurisdiction(CreateOfficerRequest req, Department department, UUID editingOfficerId) {
        if (req.role() == Role.DEPARTMENT_OFFICER) {
            boolean exists = officerRepository
                    .findByRoleAndDepartment_DepartmentId(Role.DEPARTMENT_OFFICER, department.getDepartmentId())
                    .stream()
                    .anyMatch(o -> !o.getOfficerId().equals(editingOfficerId));
            if (exists) {
                throw new BadRequestException(
                        "A Department Officer is already assigned to " + department.getDepartmentName() +
                        ". Each department must have its own dedicated Department Officer."
                );
            }
        }

        if (req.role() == Role.FIELD_OFFICER) {
            if (req.ward() == null || req.ward().isBlank()) {
                throw new BadRequestException("Ward is required when creating a Field Officer.");
            }
            String requestedWard = req.ward().trim();
            boolean exists = officerRepository
                    .findByRoleAndDepartment_DepartmentId(Role.FIELD_OFFICER, department.getDepartmentId())
                    .stream()
                    .filter(o -> !o.getOfficerId().equals(editingOfficerId))
                    .filter(Officer::isActive)
                    .anyMatch(o -> o.getWard() != null && requestedWard.equalsIgnoreCase(o.getWard().trim()));
            if (exists) {
                throw new BadRequestException(
                        "A Field Officer is already mapped to " + requestedWard +
                        " in " + department.getDepartmentName() +
                        ". Each department + ward must have its own Field Officer."
                );
            }
        }
    }

    public List<Officer> listOfficers(Role role) {
        return role == null ? officerRepository.findAll() : officerRepository.findByRole(role);
    }

    public Officer getOfficer(UUID officerId) {
        return officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
    }

    @Transactional
    public Officer updateOfficer(UUID officerId, CreateOfficerRequest req, Officer admin) {
        InputValidator.validateName(req.name());
        InputValidator.validatePhone(req.phone());

        Officer officer = getOfficer(officerId);
        Department department = departmentRepository.findById(req.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        validateJurisdiction(req, department, officer.getOfficerId());

        officer.setName(req.name());
        officer.setEmail(req.email());
        officer.setPhone(req.phone());
        officer.setRole(req.role());
        officer.setDepartment(department);
        officer.setDistrict(req.district());
        officer.setTaluk(req.taluk());
        officer.setWard(req.ward());
        officer.setOfficeAddress(req.officeAddress());
        officer = officerRepository.save(officer);

        auditLogService.record(admin, "OFFICER_UPDATED", "Officer", officer.getOfficerId(), "Updated officer details");
        return officer;
    }

    @Transactional
    public void setActive(UUID officerId, boolean active, Officer admin) {
        Officer officer = getOfficer(officerId);
        officer.setActive(active);
        officerRepository.save(officer);
        auditLogService.record(admin, active ? "OFFICER_ACTIVATED" : "OFFICER_DEACTIVATED",
                "Officer", officer.getOfficerId(), "Set isActive=" + active);
    }

    @Transactional
    public String resetPassword(UUID officerId, Officer admin) {
        Officer officer = getOfficer(officerId);
        String tempPassword = idGenerator.generateTemporaryPassword();
        officer.setPasswordHash(passwordEncoder.encode(tempPassword));
        officer.setFirstLogin(true);
        officerRepository.save(officer);

        String message = "Your JanSeva password has been reset by the Administrator. " +
                "Temporary Password: " + tempPassword + ". You must change it on your next login.";
        notificationService.notifyOfficer(officer.getOfficerId(), "PASSWORD_RESET", message, NotificationChannel.EMAIL);
        notificationService.notifyOfficer(officer.getOfficerId(), "PASSWORD_RESET", message, NotificationChannel.SMS);

        auditLogService.record(admin, "PASSWORD_RESET", "Officer", officer.getOfficerId(), "Administrator reset password");
        return tempPassword;
    }
}