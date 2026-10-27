package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.GrievanceCategory;
import com.janseva.backend.repository.GrievanceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrievanceCategoryService {

    private final GrievanceCategoryRepository categoryRepository;

    public List<GrievanceCategory> listAll() {
        return categoryRepository.findAll();
    }

    public GrievanceCategory get(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance category not found"));
    }

    public GrievanceCategory create(GrievanceCategory category) {
        return categoryRepository.save(category);
    }
}
