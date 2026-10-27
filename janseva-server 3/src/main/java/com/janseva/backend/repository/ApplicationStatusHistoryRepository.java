package com.janseva.backend.repository;

import com.janseva.backend.model.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, UUID> {
    List<ApplicationStatusHistory> findByApplication_ApplicationIdOrderByActionDateAsc(String applicationId);
}
