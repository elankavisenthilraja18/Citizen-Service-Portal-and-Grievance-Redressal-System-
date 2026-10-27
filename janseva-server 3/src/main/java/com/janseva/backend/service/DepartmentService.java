package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.Department;
import com.janseva.backend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> listAll() {
        return departmentRepository.findAll();
    }

    public Department get(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    public Department create(Department department) {
        return departmentRepository.save(department);
    }
}
