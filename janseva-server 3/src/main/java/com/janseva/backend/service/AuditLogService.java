package com.janseva.backend.service;

import com.janseva.backend.model.AuditLog;
import com.janseva.backend.model.Officer;
import com.janseva.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(Officer admin, String actionType, String targetEntity, UUID targetId, String details) {
        AuditLog log = AuditLog.builder()
                .admin(admin)
                .actionType(actionType)
                .targetEntity(targetEntity)
                .targetId(targetId)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> listAll() {
        return auditLogRepository.findAll();
    }
}
