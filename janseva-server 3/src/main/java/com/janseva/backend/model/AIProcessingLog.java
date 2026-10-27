package com.janseva.backend.model;

import com.janseva.backend.enums.Priority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records the AI engine's routing decision for a single grievance:
 * category/department detection, field-officer assignment, priority
 * prediction and duplicate-complaint detection.
 */
@Entity
@Table(name = "ai_processing_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIProcessingLog {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID aiLogId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grievance_id", unique = true)
    private Grievance grievance;

    @Column(length = 100)
    private String detectedCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detected_department_id")
    private Department detectedDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_field_officer_id")
    private Officer assignedFieldOfficer;

    @Enumerated(EnumType.STRING)
    private Priority predictedPriority;

    @Column(length = 20)
    private String duplicateOfGrievanceId;

    private BigDecimal confidenceScore;

    @CreationTimestamp
    private LocalDateTime processedAt;
}
