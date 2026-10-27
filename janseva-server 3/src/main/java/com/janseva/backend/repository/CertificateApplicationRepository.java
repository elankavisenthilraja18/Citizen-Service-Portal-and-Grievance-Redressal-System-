package com.janseva.backend.repository;

import com.janseva.backend.enums.ApplicationStatus;
import com.janseva.backend.model.CertificateApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateApplicationRepository extends JpaRepository<CertificateApplication, String> {
    List<CertificateApplication> findByCitizen_CitizenIdOrderBySubmittedAtDesc(UUID citizenId);
    List<CertificateApplication> findByStatus(ApplicationStatus status);
    List<CertificateApplication> findByCurrentOfficer_OfficerId(UUID officerId);
    long countByStatus(ApplicationStatus status);

    /** Used to block duplicate submissions: true if the citizen already has a live
     *  (non-rejected) application - including an already-issued certificate - for this service. */
    boolean existsByCitizen_CitizenIdAndService_ServiceIdAndStatusNot(UUID citizenId, UUID serviceId, ApplicationStatus status);
}
