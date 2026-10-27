package com.janseva.backend.repository;

import com.janseva.backend.enums.GrievanceStatus;
import com.janseva.backend.model.Grievance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GrievanceRepository extends JpaRepository<Grievance, String> {
    List<Grievance> findByCitizen_CitizenIdOrderBySubmittedAtDesc(UUID citizenId);
    List<Grievance> findByAssignedFieldOfficer_OfficerId(UUID officerId);
    List<Grievance> findByAssignedDepartment_DepartmentId(UUID departmentId);
    List<Grievance> findByStatus(GrievanceStatus status);
    long countByStatus(GrievanceStatus status);

    @org.springframework.data.jpa.repository.Query(
            "select g from Grievance g where g.area = :area and g.category.categoryId = :categoryId " +
                    "and g.submittedAt >= :since"
    )
    List<Grievance> findPossibleDuplicates(
            @org.springframework.data.repository.query.Param("area") String area,
            @org.springframework.data.repository.query.Param("categoryId") UUID categoryId,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since
    );

    /**
     * Hard duplicate block (SRS FR4 / FR14: "Duplicate detection on unique
     * identifiers before record creation"): true if this citizen already has
     * an open (not yet resolved/closed) grievance with the same title in the
     * same category.
     */
    @org.springframework.data.jpa.repository.Query(
            "select case when count(g) > 0 then true else false end from Grievance g " +
                    "where g.citizen.citizenId = :citizenId and g.category.categoryId = :categoryId " +
                    "and lower(g.title) = lower(:title) and g.status not in ('RESOLVED', 'CLOSED')"
    )
    boolean existsOpenDuplicate(
            @org.springframework.data.repository.query.Param("citizenId") UUID citizenId,
            @org.springframework.data.repository.query.Param("categoryId") UUID categoryId,
            @org.springframework.data.repository.query.Param("title") String title
    );
}