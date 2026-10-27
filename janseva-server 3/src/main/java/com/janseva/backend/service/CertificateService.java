package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.Certificate;
import com.janseva.backend.model.CertificateApplication;
import com.janseva.backend.model.Officer;
import com.janseva.backend.repository.CertificateRepository;
import com.janseva.backend.util.IdGenerator;
import com.janseva.backend.util.QrCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final IdGenerator idGenerator;
    private final QrCodeUtil qrCodeUtil;

    /** Called once an application reaches TAHSILDAR_APPROVED / CERTIFICATE_READY. */
    @Transactional
    public Certificate issue(CertificateApplication application, Officer tahsildar) {
        // Safety net: never issue a second certificate for the same application,
        // even if this were somehow called twice.
        var existing = certificateRepository.findByApplication_ApplicationId(application.getApplicationId());
        if (existing.isPresent()) {
            return existing.get();
        }

        String certificateNumber = idGenerator.generateCertificateNumber(application.getApplicationId());
        String verificationUrl = "https://janseva.gov.in/verify/" + certificateNumber;

        // The QR encodes a verification payload; scanning it should resolve to verificationUrl.
        String qrPayload = verificationUrl;
        String qrBase64 = qrCodeUtil.generateBase64Png(qrPayload, 300);

        String digitalSignature = signPayload(certificateNumber + "|" + application.getApplicationId()
                + "|" + tahsildar.getEmployeeId());

        Certificate certificate = Certificate.builder()
                .application(application)
                .certificateNumber(certificateNumber)
                .qrCodeData(qrBase64)
                .digitalSignature(digitalSignature)
                .issuedBy(tahsildar)
                .issueDate(LocalDate.now())
                .verificationUrl(verificationUrl)
                .build();

        return certificateRepository.save(certificate);
    }

    public Certificate getByApplication(String applicationId) {
        return certificateRepository.findByApplication_ApplicationId(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found for this application"));
    }

    /** Public endpoint: verify authenticity by certificate number (what scanning the QR resolves to). */
    public Optional<Certificate> verify(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber);
    }

    /** Simple SHA-256 based signature stand-in for a real PKI digital signature. */
    private String signPayload(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign certificate payload", e);
        }
    }
}
