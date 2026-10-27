package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.model.GovService;
import com.janseva.backend.service.GovServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceCatalogController {

    private final GovServiceCatalogService govServiceCatalogService;

    /** Public - guests can browse services, required documents (via detail) and SLA. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GovService>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(govServiceCatalogService.listActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GovService>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(govServiceCatalogService.get(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<GovService>> create(@RequestBody GovService service) {
        return ResponseEntity.ok(ApiResponse.ok("Service added", govServiceCatalogService.create(service)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<GovService>> update(@PathVariable UUID id, @RequestBody GovService service) {
        return ResponseEntity.ok(ApiResponse.ok("Service updated", govServiceCatalogService.update(id, service)));
    }
}
