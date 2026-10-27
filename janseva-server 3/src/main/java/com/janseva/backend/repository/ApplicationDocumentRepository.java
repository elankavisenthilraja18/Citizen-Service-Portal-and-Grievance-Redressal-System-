package com.janseva.backend.repository;

import com.janseva.backend.model.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, UUID> {
    List<ApplicationDocument> findByApplication_ApplicationId(String applicationId);
}
