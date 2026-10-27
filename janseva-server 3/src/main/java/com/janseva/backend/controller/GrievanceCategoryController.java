package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.model.GrievanceCategory;
import com.janseva.backend.service.GrievanceCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grievance-categories")
@RequiredArgsConstructor
public class GrievanceCategoryController {

    private final GrievanceCategoryService grievanceCategoryService;

    /** Public - guests can browse grievance categories, department and SLA before logging in. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GrievanceCategory>>> listAll() {
        return ResponseEntity.ok(ApiResponse.ok(grievanceCategoryService.listAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<GrievanceCategory>> create(@RequestBody GrievanceCategory category) {
        return ResponseEntity.ok(ApiResponse.ok("Category added", grievanceCategoryService.create(category)));
    }
}
