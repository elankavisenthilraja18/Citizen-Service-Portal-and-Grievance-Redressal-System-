package com.janseva.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID certificateId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", unique = true)
    private CertificateApplication application;

    @Column(nullable = false, unique = true, length = 50)
    private String certificateNumber;

    @Column(columnDefinition = "TEXT")
    private String qrCodeData;

    @Column(columnDefinition = "TEXT")
    private String digitalSignature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private Officer issuedBy;

    private LocalDate issueDate;

    @Column(length = 255)
    private String verificationUrl;
}
