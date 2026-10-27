package com.janseva.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Catalog of citizen services (Birth Certificate, Income Certificate, etc).
 * Maps to the "Services" table in the database design document.
 */
@Entity
@Table(name = "gov_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GovService {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID serviceId;

    @Column(nullable = false, length = 100)
    private String serviceName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private int slaDays;

    /** Comma-separated list of required document names. */
    @Column(columnDefinition = "TEXT")
    private String requiredDocuments;

    @Builder.Default
    private BigDecimal feeAmount = BigDecimal.ZERO;

    @Builder.Default
    private boolean isActive = true;
}
