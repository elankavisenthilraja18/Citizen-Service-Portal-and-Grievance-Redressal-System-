package com.janseva.backend.service;

import com.janseva.backend.dto.request.ApplicationDecisionRequest;
import com.janseva.backend.dto.request.SubmitApplicationRequest;
import com.janseva.backend.enums.ActionType;
import com.janseva.backend.enums.ApplicationStatus;
import com.janseva.backend.enums.NotificationChannel;
import com.janseva.backend.enums.Role;
import com.janseva.backend.exception.BadRequestException;
import com.janseva.backend.exception.DuplicateGrievanceException;
import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.*;
import com.janseva.backend.repository.ApplicationDocumentRepository;
import com.janseva.backend.repository.ApplicationStatusHistoryRepository;
import com.janseva.backend.repository.CertificateApplicationRepository;
import com.janseva.backend.util.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final CertificateApplicationRepository applicationRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final GovServiceCatalogService govServiceCatalogService;
    private final CertificateService certificateService;
    private final NotificationService notificationService;
    private final IdGenerator idGenerator;

    // ---------------------------------------------------------- Citizen actions

    @Transactional
    public CertificateApplication submit(Citizen citizen, SubmitApplicationRequest req) {
        GovService service = govServiceCatalogService.get(req.serviceId());

        // Prevent duplicate certificates: block a new application while the citizen
        // already has one in-flight, or already holds an issued certificate, for this service.
        if (applicationRepository.existsByCitizen_CitizenIdAndService_ServiceIdAndStatusNot(
                citizen.getCitizenId(), service.getServiceId(), ApplicationStatus.REJECTED)) {
            throw new DuplicateGrievanceException(
                    "You already have an active application or an issued certificate for "
                            + service.getServiceName() + ". Duplicate applications are not allowed.");
        }

        validateRequiredDocuments(service, req.documents());

        // If the citizen's application form didn't send an address (e.g. they left
        // the "same as profile" option on and the frontend didn't resend it), fall
        // back to whatever is saved on their profile rather than leaving it blank.
        String address = (req.address() == null || req.address().isBlank())
                ? citizen.getAddress()
                : req.address();

        String applicationId = idGenerator.generateApplicationId();
        while (applicationRepository.existsById(applicationId)) {
            applicationId = idGenerator.generateApplicationId();
        }

        CertificateApplication application = CertificateApplication.builder()
                .applicationId(applicationId)
                .citizen(citizen)
                .service(service)
                .purpose(req.purpose())
                .address(address)
                .status(ApplicationStatus.SUBMITTED)
                .build();
        application = applicationRepository.save(application);

        for (var doc : req.documents()) {
            documentRepository.save(ApplicationDocument.builder()
                    .application(application)
                    .documentType(doc.documentType())
                    .fileUrl(doc.fileUrl())
                    .build());
        }

        addHistory(application, null, "Application Submitted", ActionType.FORWARDED,
                "Declaration accepted: citizen confirmed the information provided is true.");
        notificationService.notifyCitizenAllChannels(citizen.getCitizenId(), "APPLICATION_SUBMITTED",
                "Your application " + applicationId + " for " + service.getServiceName() + " has been submitted.");

        return application;
    }

    /**
     * Every document listed in the service's requiredDocuments (comma-separated) is
     * mandatory. Rejects the submission with a clear list of what's missing rather
     * than silently accepting a partial upload.
     */
    private void validateRequiredDocuments(GovService service, List<SubmitApplicationRequest.DocumentEntry> documents) {
        List<String> required = service.getRequiredDocuments() == null ? List.of()
                : java.util.Arrays.stream(service.getRequiredDocuments().split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();

        java.util.Set<String> uploadedTypes = (documents == null ? List.<SubmitApplicationRequest.DocumentEntry>of() : documents).stream()
                .filter(d -> d.fileUrl() != null && !d.fileUrl().isBlank())
                .map(d -> d.documentType() == null ? "" : d.documentType().trim().toLowerCase())
                .collect(java.util.stream.Collectors.toSet());

        List<String> missing = required.stream()
                .filter(r -> !uploadedTypes.contains(r.toLowerCase()))
                .toList();

        if (!missing.isEmpty()) {
            throw new BadRequestException("Please upload all mandatory documents before submitting. Missing: "
                    + String.join(", ", missing));
        }
    }

    @Transactional
    public CertificateApplication resubmit(String applicationId, Citizen citizen, SubmitApplicationRequest req) {
        CertificateApplication application = get(applicationId);
        if (!application.getCitizen().getCitizenId().equals(citizen.getCitizenId())) {
            throw new BadRequestException("This application does not belong to you");
        }
        if (application.getStatus() != ApplicationStatus.REJECTED) {
            throw new BadRequestException("Only a rejected application can be resubmitted");
        }

        validateRequiredDocuments(application.getService(), req.documents());

        // Replace the old (rejected) document set entirely rather than appending to
        // it - otherwise the VAO's review screen would show both the stale rejected
        // files and the newly resubmitted ones side by side under the same
        // application, which is exactly the confusion this guards against.
        List<ApplicationDocument> oldDocuments = documentRepository.findByApplication_ApplicationId(applicationId);
        documentRepository.deleteAll(oldDocuments);

        for (var doc : req.documents()) {
            documentRepository.save(ApplicationDocument.builder()
                    .application(application)
                    .documentType(doc.documentType())
                    .fileUrl(doc.fileUrl())
                    .build());
        }
        application.setStatus(ApplicationStatus.SUBMITTED);
        application.setRejectionReason(null);
        application = applicationRepository.save(application);

        addHistory(application, null, "Corrected documents resubmitted", ActionType.RESUBMITTED,
                "Declaration re-accepted: citizen confirmed the corrected information is true.");
        notificationService.notifyCitizenAllChannels(citizen.getCitizenId(), "APPLICATION_RESUBMITTED",
                "Your corrected application " + applicationId + " has been resubmitted for verification.");

        return application;
    }

    public List<CertificateApplication> listForCitizen(java.util.UUID citizenId) {
        return applicationRepository.findByCitizen_CitizenIdOrderBySubmittedAtDesc(citizenId);
    }

    // ---------------------------------------------------------- Officer actions

    /** Queue of applications awaiting action from this officer's role. */
    public List<CertificateApplication> queueForRole(Role role) {
        return switch (role) {
            case VAO -> applicationRepository.findByStatus(ApplicationStatus.SUBMITTED);
            case RI -> applicationRepository.findByStatus(ApplicationStatus.VAO_APPROVED);
            case TAHSILDAR -> applicationRepository.findByStatus(ApplicationStatus.RI_APPROVED);
            default -> throw new BadRequestException("Role " + role + " does not have a verification queue");
        };
    }

    @Transactional
    public CertificateApplication markViewed(String applicationId, Officer officer) {
        CertificateApplication application = get(applicationId);
        if (application.getStatus() == ApplicationStatus.SUBMITTED) {
            application.setStatus(ApplicationStatus.VIEWED);
            application.setCurrentOfficer(officer);
            applicationRepository.save(application);
            addHistory(application, officer, "Viewed", ActionType.VIEWED, null);
        }
        return application;
    }

    @Transactional
    public CertificateApplication approve(String applicationId, Officer officer, ApplicationDecisionRequest req) {
        CertificateApplication application = get(applicationId);
        ApplicationStatus current = application.getStatus();

        ApplicationStatus next;
        String stageLabel;
        boolean issuesCertificate = false;

        switch (officer.getRole()) {
            case VAO -> {
                requireStatusIn(current, ApplicationStatus.SUBMITTED, ApplicationStatus.VIEWED, ApplicationStatus.UNDER_VERIFICATION);
                next = ApplicationStatus.VAO_APPROVED;
                stageLabel = "Signed by VAO";
            }
            case RI -> {
                requireStatusIn(current, ApplicationStatus.VAO_APPROVED);
                next = ApplicationStatus.RI_APPROVED;
                stageLabel = "Signed by RI";
            }
            case TAHSILDAR -> {
                requireStatusIn(current, ApplicationStatus.RI_APPROVED);
                next = ApplicationStatus.CERTIFICATE_READY;
                stageLabel = "Signed by Tahsildar - Certificate Generated";
                issuesCertificate = true;
            }
            default -> throw new BadRequestException("Role " + officer.getRole() + " cannot approve applications");
        }

        application.setStatus(next);
        application.setCurrentOfficer(officer);
        application = applicationRepository.save(application);

        addHistory(application, officer, stageLabel, ActionType.APPROVED, req == null ? null : req.remarks());

        if (issuesCertificate) {
            certificateService.issue(application, officer);
            notificationService.notifyCitizenAllChannels(application.getCitizen().getCitizenId(), "CERTIFICATE_READY",
                    "Your certificate for application " + applicationId + " is ready for download.");
        } else {
            notificationService.notifyCitizenAllChannels(application.getCitizen().getCitizenId(), "APPLICATION_FORWARDED",
                    "Your application " + applicationId + " has moved to the next stage: " + stageLabel + ".");
        }

        return application;
    }

    @Transactional
    public CertificateApplication reject(String applicationId, Officer officer, ApplicationDecisionRequest req) {
        if (req == null || req.rejectionReason() == null || req.rejectionReason().isBlank()) {
            throw new BadRequestException("A rejection reason is required");
        }
        CertificateApplication application = get(applicationId);
        application.setStatus(ApplicationStatus.REJECTED);
        application.setRejectionReason(req.rejectionReason());
        application.setCurrentOfficer(officer);
        application = applicationRepository.save(application);

        addHistory(application, officer, "Rejected", ActionType.REJECTED, req.rejectionReason());

        notificationService.notifyCitizenAllChannels(application.getCitizen().getCitizenId(), "APPLICATION_REJECTED",
                "Your application " + applicationId + " was rejected. Reason: " + req.rejectionReason() +
                        ". Please upload corrected documents and resubmit.");

        return application;
    }

    // ---------------------------------------------------------- Shared

    public CertificateApplication get(String applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application " + applicationId + " not found"));
    }

    public List<ApplicationStatusHistory> timeline(String applicationId) {
        return historyRepository.findByApplication_ApplicationIdOrderByActionDateAsc(applicationId);
    }

    public List<ApplicationDocument> documents(String applicationId) {
        return documentRepository.findByApplication_ApplicationId(applicationId);
    }

    private void addHistory(CertificateApplication application, Officer officer, String stage, ActionType action, String remarks) {
        historyRepository.save(ApplicationStatusHistory.builder()
                .application(application)
                .officer(officer)
                .stage(stage)
                .action(action)
                .remarks(remarks)
                .build());
    }

    private void requireStatusIn(ApplicationStatus current, ApplicationStatus... allowed) {
        for (ApplicationStatus a : allowed) {
            if (a == current) return;
        }
        throw new BadRequestException("Application is not in a state this role can act on (current: " + current + ")");
    }
}