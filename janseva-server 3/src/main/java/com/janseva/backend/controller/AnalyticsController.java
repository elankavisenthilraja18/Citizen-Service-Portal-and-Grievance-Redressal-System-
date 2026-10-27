package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Public homepage stats: Total Applications, Certificates Issued, Complaints Received/Resolved. */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publicStats() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.publicStats()));
    }

    @GetMapping("/full")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR','GRIEVANCE_OFFICER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> fullStats() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.fullStats()));
    }
}
