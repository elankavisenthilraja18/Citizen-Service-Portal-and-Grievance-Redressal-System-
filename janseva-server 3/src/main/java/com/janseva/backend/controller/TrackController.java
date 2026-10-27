package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.service.ApplicationService;
import com.janseva.backend.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Lets guests track an Application or Grievance by ID without logging in,
 * exactly as specified for the Guest Module.
 */
@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
public class TrackController {

    private final ApplicationService applicationService;
    private final GrievanceService grievanceService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> track(@PathVariable String id) {
        String upperId = id.toUpperCase();

        if (upperId.startsWith("CS")) {
            var application = applicationService.get(upperId);
            var timeline = applicationService.timeline(upperId);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("type", "APPLICATION");
            result.put("record", application);
            result.put("timeline", timeline);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }

        if (upperId.startsWith("GR")) {
            var grievance = grievanceService.get(upperId);
            var timeline = grievanceService.timeline(upperId);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("type", "GRIEVANCE");
            result.put("record", grievance);
            result.put("timeline", timeline);
            return ResponseEntity.ok(ApiResponse.ok(result));
        }

        throw new ResourceNotFoundException("No application or grievance found with ID " + id);
    }
}
