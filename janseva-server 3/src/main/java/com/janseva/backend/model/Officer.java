package com.janseva.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.janseva.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Government officer accounts. Unlike Citizens, these are NEVER self-registered -
 * only an ADMINISTRATOR can create them (see AdminOfficerService).
 */
@Entity
@Table(name = "officers", uniqueConstraints = {
        @UniqueConstraint(columnNames = "employeeId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Officer {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID officerId;

    /** Auto-generated login ID, e.g. VAO20260015 */
    @Column(nullable = false, unique = true, length = 20)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String email;

    @Column(length = 15)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String taluk;

    @Column(length = 50)
    private String ward;

    @Column(columnDefinition = "TEXT")
    private String officeAddress;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    /** True until the officer changes their temporary password on first login. */
    @Builder.Default
    private boolean firstLogin = true;

    @Builder.Default
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Officer createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
