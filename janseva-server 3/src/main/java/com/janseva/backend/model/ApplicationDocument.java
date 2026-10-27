package com.janseva.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "application_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDocument {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID documentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id")
    private CertificateApplication application;

    @Column(nullable = false, length = 100)
    private String documentType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
