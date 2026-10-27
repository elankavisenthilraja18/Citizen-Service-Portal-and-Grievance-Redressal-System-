package com.janseva.backend.service;

import com.janseva.backend.dto.request.FieldUpdateRequest;
import com.janseva.backend.dto.request.ReassignGrievanceRequest;
import com.janseva.backend.dto.request.SubmitGrievanceRequest;
import com.janseva.backend.enums.GrievanceStatus;
import com.janseva.backend.exception.BadRequestException;
import com.janseva.backend.exception.DuplicateGrievanceException;
import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.*;
import com.janseva.backend.repository.GrievanceCategoryRepository;
import com.janseva.backend.repository.GrievanceStatusHistoryRepository;
import com.janseva.backend.repository.GrievanceRepository;
import com.janseva.backend.repository.OfficerRepository;
import com.janseva.backend.util.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrievanceService {

    private final GrievanceRepository grievanceRepository;
    private final GrievanceCategoryRepository categoryRepository;
    private final GrievanceStatusHistoryRepository historyRepository;
    private final AIProcessingService aiProcessingService;
    private final NotificationService notificationService;
    private final IdGenerator idGenerator;
    private final OfficerRepository officerRepository;

    @Transactional
    public Grievance submit(Citizen citizen, SubmitGrievanceRequest req) {
        GrievanceCategory category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Grievance category not found"));

        // SRS FR4/FR14: block a duplicate grievance (same citizen, same category,
        // same title) while an earlier one is still open.
        if (grievanceRepository.existsOpenDuplicate(citizen.getCitizenId(), category.getCategoryId(), req.title())) {
            throw new DuplicateGrievanceException(
                    "You already have an open complaint with this same title in this category. "
                            + "Please check My Complaints or update the existing one instead of submitting a duplicate.");
        }

        String grievanceId = idGenerator.generateGrievanceId();
        while (grievanceRepository.existsById(grievanceId)) {
            grievanceId = idGenerator.generateGrievanceId();
        }

        Grievance grievance = Grievance.builder()
                .grievanceId(grievanceId)
                .citizen(citizen)
                .category(category)
                .title(req.title())
                .description(req.description())
                .area(req.area())
                .ward(req.ward())
                .geoLat(req.geoLat())
                .geoLng(req.geoLng())
                .photoUrl(req.photoUrl())
                .status(GrievanceStatus.SUBMITTED)
                .build();
        grievance = grievanceRepository.save(grievance);
        addHistory(grievance, null, "Complaint Submitted", null, null);

        // --- AI processing: detect department, assign field officer, predict priority, flag duplicates
        AIProcessingLog aiLog = aiProcessingService.process(grievance);

        grievance.setAssignedDepartment(aiLog.getDetectedDepartment());
        grievance.setAssignedFieldOfficer(aiLog.getAssignedFieldOfficer());
        grievance.setPriority(aiLog.getPredictedPriority());
        grievance.setStatus(GrievanceStatus.ASSIGNED);
        grievance = grievanceRepository.save(grievance);

        String assignRemark = "AI-assigned to " + (aiLog.getAssignedFieldOfficer() != null
                ? aiLog.getAssignedFieldOfficer().getName() : "the department queue")
                + (aiLog.getDuplicateOfGrievanceId() != null
                ? " (possible duplicate of " + aiLog.getDuplicateOfGrievanceId() + ")" : "");
        addHistory(grievance, null, "Assigned to Field Officer", assignRemark, null);

        notificationService.notifyCitizenAllChannels(citizen.getCitizenId(), "GRIEVANCE_SUBMITTED",
                "Your complaint " + grievanceId + " has been registered and assigned. Priority: " + grievance.getPriority());

        return grievance;
    }

    public List<Grievance> listForCitizen(UUID citizenId) {
        return grievanceRepository.findByCitizen_CitizenIdOrderBySubmittedAtDesc(citizenId);
    }

    public List<Grievance> listForFieldOfficer(UUID officerId) {
        return grievanceRepository.findByAssignedFieldOfficer_OfficerId(officerId);
    }

    public List<Grievance> listForDepartment(UUID departmentId) {
        return grievanceRepository.findByAssignedDepartment_DepartmentId(departmentId);
    }

    public List<Grievance> listByStatus(GrievanceStatus status) {
        return grievanceRepository.findByStatus(status);
    }

    public List<Grievance> listAll() {
        return grievanceRepository.findAll();
    }

    public Grievance get(String grievanceId) {
        return grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance " + grievanceId + " not found"));
    }

    public List<GrievanceStatusHistory> timeline(String grievanceId) {
        return historyRepository.findByGrievance_GrievanceIdOrderByActionDateAsc(grievanceId);
    }

    @Transactional
    public Grievance markViewed(String grievanceId, Officer officer) {
        Grievance grievance = get(grievanceId);
        if (grievance.getStatus() == GrievanceStatus.SUBMITTED) {
            grievance.setStatus(GrievanceStatus.VIEWED);
            grievanceRepository.save(grievance);
            addHistory(grievance, officer, "Complaint Viewed", null, null);
        }
        return grievance;
    }

    // ---------------------------------------------------------- Field Officer

    @Transactional
    public Grievance fieldUpdate(String grievanceId, Officer fieldOfficer, FieldUpdateRequest req) {
        Grievance grievance = get(grievanceId);
        if (grievance.getAssignedFieldOfficer() == null
                || !grievance.getAssignedFieldOfficer().getOfficerId().equals(fieldOfficer.getOfficerId())) {
            throw new BadRequestException("This grievance is not assigned to you");
        }

        if (req.markResolved()) {
            boolean hasPreviousWorkUpdate = historyRepository
                    .findByGrievance_GrievanceIdOrderByActionDateAsc(grievanceId)
                    .stream()
                    .anyMatch(h -> "Field Visit Completed".equalsIgnoreCase(h.getStage())
                            || "Work In Progress".equalsIgnoreCase(h.getStage()));
            if (!hasPreviousWorkUpdate) {
                throw new BadRequestException(
                        "Please save at least one field work update before marking the complaint resolved."
                );
            }
            if (req.photoUrl() == null || req.photoUrl().isBlank()) {
                throw new BadRequestException("A geo-tagged photo is required before marking this complaint resolved");
            }
            grievance.setStatus(GrievanceStatus.RESOLVED);
            grievanceRepository.save(grievance);
            addHistory(grievance, fieldOfficer, "Resolved", req.remarks(), req.photoUrl());
            String message = "Complaint " + grievanceId +
                    " has been resolved by Field Officer " + fieldOfficer.getName() +
                    " and is awaiting your department verification and closure.";
            notifyDepartmentOfficer(grievance, "GRIEVANCE_RESOLVED", message);
            notificationService.notifyCitizenAllChannels(grievance.getCitizen().getCitizenId(), "GRIEVANCE_RESOLVED",
                    "Your complaint " + grievanceId + " has been resolved by the Field Officer and is now awaiting department verification.");
        } else {
            GrievanceStatus next = grievance.getStatus() == GrievanceStatus.ASSIGNED
                    ? GrievanceStatus.FIELD_VISIT_COMPLETED
                    : GrievanceStatus.IN_PROGRESS;
            grievance.setStatus(next);
            grievance.setExpectedCompletionDate(req.expectedCompletionDate());
            grievanceRepository.save(grievance);
            addHistory(grievance, fieldOfficer,
                    next == GrievanceStatus.FIELD_VISIT_COMPLETED ? "Field Visit Completed" : "Work In Progress",
                    req.remarks(), req.photoUrl());
            String message = "Complaint " + grievanceId + " has a new field update: " + next +
                    (req.remarks() != null && !req.remarks().isBlank() ? " — " + req.remarks() : "");
            notifyDepartmentOfficer(grievance, "GRIEVANCE_UPDATED", message);
            notificationService.notifyCitizenAllChannels(grievance.getCitizen().getCitizenId(), "GRIEVANCE_UPDATED",
                    "Your complaint " + grievanceId + " has been updated: " + next);
        }
        return grievance;
    }

    // ---------------------------------------------------------- Department Officer

    @Transactional
    public Grievance approveResolution(String grievanceId, Officer departmentOfficer) {
        Grievance grievance = get(grievanceId);
        if (grievance.getStatus() != GrievanceStatus.RESOLVED) {
            throw new BadRequestException("Only a resolved complaint can be closed");
        }

        if (grievance.getAssignedDepartment() == null || departmentOfficer.getDepartment() == null ||
                !grievance.getAssignedDepartment().getDepartmentId()
                        .equals(departmentOfficer.getDepartment().getDepartmentId())) {
            throw new BadRequestException("You can close complaints only for your own department.");
        }

        // Cross-verification: the field officer's resolution must include geo-tagged
        // photo evidence before the department officer is allowed to close it out.
        boolean hasResolutionPhoto = historyRepository.findByGrievance_GrievanceIdOrderByActionDateAsc(grievanceId)
                .stream()
                .anyMatch(h -> "Resolved".equalsIgnoreCase(h.getStage()) && h.getPhotoUrl() != null && !h.getPhotoUrl().isBlank());
        if (!hasResolutionPhoto) {
            throw new BadRequestException("Cannot close: the field officer has not uploaded a geo-tagged resolution photo yet.");
        }

        grievance.setStatus(GrievanceStatus.CLOSED);
        grievanceRepository.save(grievance);
        addHistory(grievance, departmentOfficer, "Closed", "Resolution cross-verified and approved by department", null);

        notificationService.notifyCitizenAllChannels(grievance.getCitizen().getCitizenId(), "GRIEVANCE_CLOSED",
                "Good news! Your complaint " + grievanceId + " — issue solved and closed after verification. Thank you for reporting it.");
        return grievance;
    }

    @Transactional
    public Grievance escalate(String grievanceId, Officer officer, String remarks) {
        Grievance grievance = get(grievanceId);
        addHistory(grievance, officer, "Escalated to Grievance Officer", remarks, null);
        return grievance;
    }

    // ---------------------------------------------------------- Grievance Officer

    @Transactional
    public Grievance reassign(String grievanceId, Officer grievanceOfficer, ReassignGrievanceRequest req,
                              Department newDepartment, Officer newFieldOfficer) {
        Grievance grievance = get(grievanceId);
        if (newDepartment != null) grievance.setAssignedDepartment(newDepartment);
        if (newFieldOfficer != null) {
            if (newFieldOfficer.getRole() != com.janseva.backend.enums.Role.FIELD_OFFICER ||
                    !newFieldOfficer.isActive()) {
                throw new BadRequestException("Selected officer is not an active Field Officer.");
            }
            if (grievance.getAssignedDepartment() == null || newFieldOfficer.getDepartment() == null ||
                    !grievance.getAssignedDepartment().getDepartmentId()
                            .equals(newFieldOfficer.getDepartment().getDepartmentId())) {
                throw new BadRequestException("Field Officer must belong to the grievance department.");
            }
            if (grievance.getWard() == null || newFieldOfficer.getWard() == null ||
                    !grievance.getWard().equalsIgnoreCase(newFieldOfficer.getWard())) {
                throw new BadRequestException("Field Officer must be mapped to the grievance ward.");
            }
            grievance.setAssignedFieldOfficer(newFieldOfficer);
        }
        grievanceRepository.save(grievance);
        addHistory(grievance, grievanceOfficer, "Reassigned by Grievance Officer", req.remarks(), null);

        notificationService.notifyCitizenAllChannels(grievance.getCitizen().getCitizenId(), "GRIEVANCE_REASSIGNED",
                "Your complaint " + grievanceId + " has been reassigned for faster resolution.");
        return grievance;
    }

    @Transactional
    public Grievance markOverdueEscalation(String grievanceId, Officer officer, String remarks) {
        return escalate(grievanceId, officer, "OVERDUE ESCALATION: " + remarks);
    }

    private void notifyDepartmentOfficer(Grievance grievance, String eventType, String message) {
        if (grievance.getAssignedDepartment() == null) return;

        officerRepository
                .findByRoleAndDepartment_DepartmentId(
                        com.janseva.backend.enums.Role.DEPARTMENT_OFFICER,
                        grievance.getAssignedDepartment().getDepartmentId())
                .stream()
                .filter(Officer::isActive)
                .findFirst()
                .ifPresent(o -> notificationService.notifyOfficer(
                        o.getOfficerId(), eventType, message,
                        com.janseva.backend.enums.NotificationChannel.IN_APP));
    }

    private void addHistory(Grievance grievance, Officer officer, String stage, String remarks, String photoUrl) {
        historyRepository.save(GrievanceStatusHistory.builder()
                .grievance(grievance)
                .officer(officer)
                .stage(stage)
                .remarks(remarks)
                .photoUrl(photoUrl)
                .build());
    }
}