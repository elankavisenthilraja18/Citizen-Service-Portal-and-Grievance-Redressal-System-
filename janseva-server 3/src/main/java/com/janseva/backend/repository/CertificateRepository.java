package com.janseva.backend.repository;

import com.janseva.backend.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    Optional<Certificate> findByApplication_ApplicationId(String applicationId);
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
}
