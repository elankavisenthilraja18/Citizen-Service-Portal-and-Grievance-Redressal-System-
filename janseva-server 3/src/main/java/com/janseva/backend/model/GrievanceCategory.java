package com.janseva.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "grievance_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceCategory {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID categoryId;

    @Column(nullable = false, unique = true, length = 100)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_department_id")
    private Department defaultDepartment;

    private int slaDays;
}
