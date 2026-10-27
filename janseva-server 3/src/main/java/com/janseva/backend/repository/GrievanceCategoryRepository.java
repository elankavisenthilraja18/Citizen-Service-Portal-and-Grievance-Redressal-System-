package com.janseva.backend.repository;

import com.janseva.backend.model.GrievanceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GrievanceCategoryRepository extends JpaRepository<GrievanceCategory, UUID> {
}
