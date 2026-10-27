package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.Citizen;
import com.janseva.backend.repository.CitizenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitizenService {

    private final CitizenRepository citizenRepository;

    public Citizen get(UUID id) {
        return citizenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));
    }

    public Citizen updateProfile(UUID id, Citizen updated) {
        Citizen existing = get(id);
        existing.setFullName(updated.getFullName());
        existing.setEmail(updated.getEmail());
        existing.setAddress(updated.getAddress());
        existing.setDistrict(updated.getDistrict());
        existing.setWard(updated.getWard());
        existing.setLanguagePreference(updated.getLanguagePreference());
        return citizenRepository.save(existing);
    }
}
