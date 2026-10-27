package com.janseva.backend.service;

import com.janseva.backend.enums.ApplicationStatus;
import com.janseva.backend.enums.GrievanceStatus;
import com.janseva.backend.enums.Role;
import com.janseva.backend.repository.CertificateApplicationRepository;
import com.janseva.backend.repository.CertificateRepository;
import com.janseva.backend.repository.GrievanceRepository;
import com.janseva.backend.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CertificateApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final GrievanceRepository grievanceRepository;
    private final OfficerRepository officerRepository;

    /** Public, unauthenticated headline stats shown on the homepage. */
    public Map<String, Object> publicStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalApplications", applicationRepository.count());
        stats.put("certificatesIssued", certificateRepository.count());
        stats.put("totalGrievances", grievanceRepository.count());
        stats.put("resolvedGrievances", grievanceRepository.countByStatus(GrievanceStatus.CLOSED));
        return stats;
    }

    /** Full breakdown for the Administrator / Grievance Officer dashboards. */
    public Map<String, Object> fullStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        Map<String, Long> applicationsByStatus = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) {
            applicationsByStatus.put(s.name(), applicationRepository.countByStatus(s));
        }
        stats.put("applicationsByStatus", applicationsByStatus);

        Map<String, Long> grievancesByStatus = new LinkedHashMap<>();
        for (GrievanceStatus s : GrievanceStatus.values()) {
            grievancesByStatus.put(s.name(), grievanceRepository.countByStatus(s));
        }
        stats.put("grievancesByStatus", grievancesByStatus);

        Map<String, Long> officersByRole = new LinkedHashMap<>();
        for (Role r : Role.values()) {
            officersByRole.put(r.name(), officerRepository.countByRole(r));
        }
        stats.put("officersByRole", officersByRole);

        stats.put("totalApplications", applicationRepository.count());
        stats.put("certificatesIssued", certificateRepository.count());
        stats.put("totalGrievances", grievanceRepository.count());

        return stats;
    }
}
