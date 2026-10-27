package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.GovService;
import com.janseva.backend.repository.GovServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GovServiceCatalogService {

    private final GovServiceRepository govServiceRepository;

    public List<GovService> listActive() {
        return govServiceRepository.findByIsActiveTrue();
    }

    public List<GovService> listAll() {
        return govServiceRepository.findAll();
    }

    public GovService get(UUID id) {
        return govServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
    }

    public GovService create(GovService service) {
        return govServiceRepository.save(service);
    }

    public GovService update(UUID id, GovService updated) {
        GovService existing = get(id);
        existing.setServiceName(updated.getServiceName());
        existing.setDepartment(updated.getDepartment());
        existing.setSlaDays(updated.getSlaDays());
        existing.setRequiredDocuments(updated.getRequiredDocuments());
        existing.setFeeAmount(updated.getFeeAmount());
        existing.setActive(updated.isActive());
        return govServiceRepository.save(existing);
    }
}
