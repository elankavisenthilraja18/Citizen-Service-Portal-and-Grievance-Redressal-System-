package com.janseva.backend.repository;

import com.janseva.backend.model.AIProcessingLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AIProcessingLogRepository extends JpaRepository<AIProcessingLog, UUID> {
    Optional<AIProcessingLog> findByGrievance_GrievanceId(String grievanceId);
}
