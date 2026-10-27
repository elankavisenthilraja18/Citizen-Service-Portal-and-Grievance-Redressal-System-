package com.janseva.backend.repository;

import com.janseva.backend.enums.Role;
import com.janseva.backend.model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OfficerRepository extends JpaRepository<Officer, UUID> {
    Optional<Officer> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    List<Officer> findByRole(Role role);
    List<Officer> findByRoleAndDistrict(Role role, String district);
    List<Officer> findByRoleAndDepartment_DepartmentId(Role role, UUID departmentId);
    long countByRole(Role role);
}
