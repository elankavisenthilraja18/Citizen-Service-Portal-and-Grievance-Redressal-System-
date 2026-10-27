package com.janseva.backend.model;

import com.janseva.backend.enums.GrievanceStatus;
import com.janseva.backend.enums.Priority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A citizen-submitted civic complaint. Uses a human-readable ID (e.g. GR2025000456)
 * as its primary key, matching the ID shown on the portal.
 */
@Entity
@Table(name = "grievances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grievance {

    @Id
    @Column(length = 20)
    private String grievanceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "citizen_id")
    private Citizen citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private GrievanceCategory category;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 150)
    private String area;

    @Column(length = 50)
    private String ward;

    private BigDecimal geoLat;

    private BigDecimal geoLng;

    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private GrievanceStatus status = GrievanceStatus.SUBMITTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_department_id")
    private Department assignedDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_field_officer_id")
    private Officer assignedFieldOfficer;

    private LocalDate expectedCompletionDate;

    @CreationTimestamp
    private LocalDateTime submittedAt;
}
