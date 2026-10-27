package com.janseva.backend.security;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.Citizen;
import com.janseva.backend.model.Officer;
import com.janseva.backend.repository.CitizenRepository;
import com.janseva.backend.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final AuthContext authContext;
    private final CitizenRepository citizenRepository;
    private final OfficerRepository officerRepository;

    public Citizen currentCitizen() {
        return citizenRepository.findById(authContext.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));
    }

    public Officer currentOfficer() {
        return officerRepository.findById(authContext.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
    }
}
