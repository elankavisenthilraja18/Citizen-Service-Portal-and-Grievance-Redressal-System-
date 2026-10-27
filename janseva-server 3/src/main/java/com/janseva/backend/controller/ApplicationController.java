package com.janseva.backend.controller;

import com.janseva.backend.dto.request.ApplicationDecisionRequest;
import com.janseva.backend.dto.request.SubmitApplicationRequest;
import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.model.*;
import com.janseva.backend.security.CurrentUserResolver;
import com.janseva.backend.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CurrentUserResolver currentUserResolver;

    // ---------------------------------------------------------- Citizen

    @PostMapping
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<CertificateApplication>> submit(@Valid @RequestBody SubmitApplicationRequest req) {
        Citizen citizen = currentUserResolver.currentCitizen();
        CertificateApplication app = applicationService.submit(citizen, req);
        return ResponseEntity.ok(ApiResponse.ok("Application submitted. ID: " + app.getApplicationId(), app));
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<CertificateApplication>> resubmit(@PathVariable String id,
                                                                         @Valid @RequestBody SubmitApplicationRequest req) {
        Citizen citizen = currentUserResolver.currentCitizen();
        return ResponseEntity.ok(ApiResponse.ok("Application resubmitted", applicationService.resubmit(id, citizen, req)));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<ApiResponse<List<CertificateApplication>>> mine() {
        Citizen citizen = currentUserResolver.currentCitizen();
        return ResponseEntity.ok(ApiResponse.ok(applicationService.listForCitizen(citizen.getCitizenId())));
    }

    // ---------------------------------------------------------- Officer (VAO / RI / Tahsildar)

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('VAO','RI','TAHSILDAR')")
    public ResponseEntity<ApiResponse<List<CertificateApplication>>> queue() {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok(applicationService.queueForRole(officer.getRole())));
    }

    @PostMapping("/{id}/view")
    @PreAuthorize("hasAnyRole('VAO','RI','TAHSILDAR')")
    public ResponseEntity<ApiResponse<CertificateApplication>> view(@PathVariable String id) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok(applicationService.markViewed(id, officer)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('VAO','RI','TAHSILDAR')")
    public ResponseEntity<ApiResponse<CertificateApplication>> approve(@PathVariable String id,
                                                                        @RequestBody(required = false) ApplicationDecisionRequest req) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok("Approved & forwarded", applicationService.approve(id, officer, req)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('VAO','RI','TAHSILDAR')")
    public ResponseEntity<ApiResponse<CertificateApplication>> reject(@PathVariable String id,
                                                                       @Valid @RequestBody ApplicationDecisionRequest req) {
        Officer officer = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok("Application rejected. Citizen notified via SMS & Email.",
                applicationService.reject(id, officer, req)));
    }

    // ---------------------------------------------------------- Shared (any authenticated role)

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CertificateApplication>> get(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.get(id)));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<ApplicationStatusHistory>>> timeline(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.timeline(id)));
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<ApiResponse<List<ApplicationDocument>>> documents(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.documents(id)));
    }
}
