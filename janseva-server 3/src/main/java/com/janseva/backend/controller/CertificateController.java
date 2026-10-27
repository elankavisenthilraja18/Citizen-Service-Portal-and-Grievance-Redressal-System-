package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.model.Certificate;
import com.janseva.backend.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<Certificate>> byApplication(@PathVariable String applicationId) {
        return ResponseEntity.ok(ApiResponse.ok(certificateService.getByApplication(applicationId)));
    }

    /**
     * Public: what scanning the certificate's QR code resolves to.
     * certificateNumber (e.g. "TN/CS2025000123") is passed as a query param
     * since it contains a "/" that would otherwise break path matching.
     */
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<?>> verify(@RequestParam String certificateNumber) {
        return certificateService.verify(certificateNumber)
                .<ResponseEntity<ApiResponse<?>>>map(cert -> ResponseEntity.ok(
                        ApiResponse.ok("Certificate is authentic and verified", cert)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.fail("No certificate found with this number")));
    }
}
