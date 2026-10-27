package com.janseva.backend.repository;

import com.janseva.backend.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByDepartmentNameIgnoreCase(String name);
}
