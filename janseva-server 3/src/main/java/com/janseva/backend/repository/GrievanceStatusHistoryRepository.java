package com.janseva.backend.repository;

import com.janseva.backend.model.GrievanceStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GrievanceStatusHistoryRepository extends JpaRepository<GrievanceStatusHistory, UUID> {
    List<GrievanceStatusHistory> findByGrievance_GrievanceIdOrderByActionDateAsc(String grievanceId);
}
