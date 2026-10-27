package com.janseva.backend.service;

import com.janseva.backend.exception.ResourceNotFoundException;
import com.janseva.backend.model.AIProcessingLog;
import com.janseva.backend.repository.AIProcessingLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AIProcessingLogQueryService {

    private final AIProcessingLogRepository aiProcessingLogRepository;

    public AIProcessingLog getByGrievance(String grievanceId) {
        return aiProcessingLogRepository.findByGrievance_GrievanceId(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("No AI processing log for this grievance"));
    }
}
