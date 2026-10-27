package com.janseva.backend.controller;

import com.janseva.backend.dto.request.CreateOfficerRequest;
import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.dto.response.OfficerCreatedResponse;
import com.janseva.backend.enums.Role;
import com.janseva.backend.model.Officer;
import com.janseva.backend.security.CurrentUserResolver;
import com.janseva.backend.service.AdminOfficerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Only an ADMINISTRATOR may create, edit, deactivate or reset the password
 * of a government officer account - officers can never self-register.
 */
@RestController
@RequestMapping("/api/admin/officers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminOfficerController {

    private final AdminOfficerService adminOfficerService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    public ResponseEntity<ApiResponse<OfficerCreatedResponse>> createOfficer(@Valid @RequestBody CreateOfficerRequest req) {
        Officer admin = currentUserResolver.currentOfficer();
        OfficerCreatedResponse res = adminOfficerService.createOfficer(req, admin);
        return ResponseEntity.ok(ApiResponse.ok("Officer account created. Credentials sent via Email & SMS.", res));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Officer>>> listOfficers(@RequestParam(required = false) Role role) {
        return ResponseEntity.ok(ApiResponse.ok(adminOfficerService.listOfficers(role)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Officer>> getOfficer(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminOfficerService.getOfficer(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Officer>> updateOfficer(@PathVariable UUID id, @Valid @RequestBody CreateOfficerRequest req) {
        Officer admin = currentUserResolver.currentOfficer();
        return ResponseEntity.ok(ApiResponse.ok("Officer updated", adminOfficerService.updateOfficer(id, req, admin)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        adminOfficerService.setActive(id, false, currentUserResolver.currentOfficer());
        return ResponseEntity.ok(ApiResponse.ok("Officer deactivated", null));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable UUID id) {
        adminOfficerService.setActive(id, true, currentUserResolver.currentOfficer());
        return ResponseEntity.ok(ApiResponse.ok("Officer activated", null));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@PathVariable UUID id) {
        String temp = adminOfficerService.resetPassword(id, currentUserResolver.currentOfficer());
        return ResponseEntity.ok(ApiResponse.ok("Password reset. New credentials sent via Email & SMS.",
                Map.of("temporaryPassword", temp)));
    }
}
