package com.janseva.backend.controller;

import com.janseva.backend.dto.request.FieldUpdateRequest;
import com.janseva.backend.dto.request.ReassignGrievanceRequest;
import com.janseva.backend.dto.request.SubmitGrievanceRequest;
import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.enums.GrievanceStatus;
import com.janseva.backend.model.*;
import com.janseva.backend.repository.DepartmentRepository;
import com.janseva.backend.repository.OfficerRepository;
import com.janseva.backend.security.CurrentUserResolver;
import com.janseva.backend.service.AIProcessingLogQueryService;
import com.janseva.backend.service.GrievanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grievances")
@RequiredArgsConstructor
public class GrievanceController {

    private final GrievanceService grievanceService;
    private final CurrentUserResolver currentUserResolver;
    private final DepartmentRepository departmentRepository;
    private final OfficerRepository officerRepository;
    private final AIProcessingLogQueryService aiProcessingLogQueryService;

    // ---------------------------------------------------------- Citizen

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<Grievance>> submit(@Valid @RequestBody SubmitGrievanceRequest req) {
        Citizen citizen = currentUserResolver.currentCitizen();
        Grievance grievance = grievanceService.submit(citizen, req);
        return ResponseEntity.ok(ApiResponse.ok("Complaint registered. ID: " + grievance.getGrievanceId(), grievance));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<List<Grievance>>> mine() {
        Citizen citizen = currentUserResolver.currentCitizen();
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.listForCitizen(citizen.getCitizenId())));
    }

    // ---------------------------------------------------------- Field Officer

    @GetMapping("/field/mine")
    @PreAuthorize("hasRole('FIELD_OFFICER')")
    public ResponseEntity<ApiResponse<List<Grievance>>> myFieldTasks() {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.listForFieldOfficer(officer.getOfficerId())));
    }

    @PostMapping("/{id}/field-update")
    @PreAuthorize("hasRole('FIELD_OFFICER')")
    public ResponseEntity<ApiResponse<Grievance>> fieldUpdate(@PathVariable String id, @RequestBody FieldUpdateRequest req) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok("Field update recorded", grievanceService.fieldUpdate(id, officer, req)));
    }

    // ---------------------------------------------------------- Department Officer

    @GetMapping("/department/mine")
    @PreAuthorize("hasRole('DEPARTMENT_OFFICER')")
    public ResponseEntity<ApiResponse<List<Grievance>>> myDepartmentGrievances() {
        Officer officer = currentUserResolver.currentOfficer();
        if (officer.getDepartment() == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.listForDepartment(officer.getDepartment().getDepartmentId())));
    }

    @PostMapping("/{id}/approve-resolution")
    @PreAuthorize("hasRole('DEPARTMENT_OFFICER')")
    public ResponseEntity<ApiResponse<Grievance>> approveResolution(@PathVariable String id) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok("Resolution approved. Citizen notified.",
                grievanceService.approveResolution(id, officer)));
    }

    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('DEPARTMENT_OFFICER','FIELD_OFFICER')")
    public ResponseEntity<ApiResponse<Grievance>> escalate(@PathVariable String id, @RequestBody(required = false) java.util.Map<String, String> body) {
        Officer officer = currentUserResolver.currentOfficer();
        String remarks = body == null ? null : body.get("remarks");
        return ResponseEntity.ok(ApiResponse.ok("Escalated to Grievance Officer", grievanceService.escalate(id, officer, remarks)));
    }

    // ---------------------------------------------------------- Grievance Officer / Administrator (oversight)

    @GetMapping
    @PreAuthorize("hasAnyRole('GRIEVANCE_OFFICER','ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<List<Grievance>>> listAll(@RequestParam(required = false) GrievanceStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(status == null ? grievanceService.listAll() : grievanceService.listByStatus(status)));
    }

    @PostMapping("/{id}/reassign")
    @PreAuthorize("hasRole('GRIEVANCE_OFFICER')")
    public ResponseEntity<ApiResponse<Grievance>> reassign(@PathVariable String id, @RequestBody ReassignGrievanceRequest req) {
        Officer grievanceOfficer = currentUserResolver.currentOfficer();
        Department department = req.departmentId() != null ? departmentRepository.findById(req.departmentId()).orElse(null) : null;
        Officer fieldOfficer = req.fieldOfficerId() != null ? officerRepository.findById(req.fieldOfficerId()).orElse(null) : null;
        return ResponseEntity.ok(ApiResponse.ok("Grievance reassigned",
                grievanceService.reassign(id, grievanceOfficer, req, department, fieldOfficer)));
    }

    // ---------------------------------------------------------- Shared (any authenticated role)

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Grievance>> get(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.get(id)));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<GrievanceStatusHistory>>> timeline(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.timeline(id)));
    }

    @GetMapping("/{id}/ai-log")
    public ResponseEntity<ApiResponse<AIProcessingLog>> aiLog(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(aiProcessingLogQueryService.getByGrievance(id)));
    }

    @PostMapping("/{id}/view")
    @PreAuthorize("hasAnyRole('DEPARTMENT_OFFICER','GRIEVANCE_OFFICER','FIELD_OFFICER')")
    public ResponseEntity<ApiResponse<Grievance>> view(@PathVariable String id) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok(grievanceService.markViewed(id, officer)));
    }
}
