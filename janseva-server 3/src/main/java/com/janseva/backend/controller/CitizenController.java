package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.model.Citizen;
import com.janseva.backend.security.CurrentUserResolver;
import com.janseva.backend.service.CitizenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/citizens")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CITIZEN')")
public class CitizenController {

    private final CitizenService citizenService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Citizen>> me() {
        return ResponseEntity.ok(ApiResponse.ok(currentUserResolver.currentCitizen()));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Citizen>> updateMe(@RequestBody Citizen updated) {
        Citizen current = currentUserResolver.currentCitizen();
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", citizenService.updateProfile(current.getCitizenId(), updated)));
    }
}
