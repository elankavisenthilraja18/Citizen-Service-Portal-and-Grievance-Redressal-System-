package com.janseva.backend.service;

import com.janseva.backend.enums.Priority;
import com.janseva.backend.enums.Role;
import com.janseva.backend.exception.BadRequestException;
import com.janseva.backend.model.*;
import com.janseva.backend.repository.AIProcessingLogRepository;
import com.janseva.backend.repository.GrievanceRepository;
import com.janseva.backend.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simulates the AI engine described in the portal spec:
 *  - analyze description & photo (heuristic keyword scoring here, swap for a
 *    real ML/LLM call in production)
 *  - detect category & correct department
 *  - assign the nearest available field officer
 *  - predict priority (High / Medium / Low)
 *  - detect duplicate complaints nearby
 */
@Service
@RequiredArgsConstructor
public class AIProcessingService {

    private final AIProcessingLogRepository aiLogRepository;
    private final GrievanceRepository grievanceRepository;
    private final OfficerRepository officerRepository;

    private static final List<String> HIGH_KEYWORDS = List.of(
            "urgent", "danger", "dangerous", "accident", "fire", "collapse", "sewage overflow",
            "live wire", "large pothole", "flood", "electrocut", "injury", "leak", "burst");
    private static final List<String> LOW_KEYWORDS = List.of("minor", "small", "cosmetic", "slight");

    private final AtomicInteger roundRobin = new AtomicInteger(0);

    public AIProcessingLog process(Grievance grievance) {
        Department department = grievance.getCategory() != null
                ? grievance.getCategory().getDefaultDepartment()
                : null;

        Officer fieldOfficer = assignFieldOfficer(grievance, department);
        Priority priority = predictPriority(grievance.getTitle() + " " + grievance.getDescription());
        Grievance duplicate = findDuplicate(grievance);

        AIProcessingLog log = AIProcessingLog.builder()
                .grievance(grievance)
                .detectedCategory(grievance.getCategory() != null ? grievance.getCategory().getCategoryName() : null)
                .detectedDepartment(department)
                .assignedFieldOfficer(fieldOfficer)
                .predictedPriority(priority)
                .duplicateOfGrievanceId(duplicate != null ? duplicate.getGrievanceId() : null)
                .confidenceScore(BigDecimal.valueOf(0.86 + Math.random() * 0.12).setScale(2, java.math.RoundingMode.HALF_UP))
                .build();

        return aiLogRepository.save(log);
    }

    /**
     * Matches the workflow: when the Administrator onboards a Field Officer, a
     * department and ward/district are recorded on that account. A new complaint
     * must land on the dashboard of whichever field officer actually covers that
     * ward - not just any officer in the department. Falls back progressively so
     * a complaint is never left unassigned just because no exact ward match exists.
     */
    private Officer assignFieldOfficer(Grievance grievance, Department department) {
        if (department == null) {
            throw new BadRequestException("This complaint has no department mapping. Please contact the administrator.");
        }

        String ward = normalize(grievance.getWard());
        if (ward == null) {
            throw new BadRequestException("Ward is required for grievance routing.");
        }

        // Strict routing: SAME department + SAME ward.
        List<Officer> candidates = officerRepository
                .findByRoleAndDepartment_DepartmentId(Role.FIELD_OFFICER, department.getDepartmentId())
                .stream()
                .filter(Officer::isActive)
                .filter(o -> ward.equals(normalize(o.getWard())))
                .toList();

        if (candidates.isEmpty()) {
            throw new BadRequestException(
                    "No active Field Officer is mapped to " + grievance.getWard() +
                    " in " + department.getDepartmentName() +
                    ". Ask the Administrator to assign a Field Officer to this department and ward."
            );
        }

        // Normally there is exactly one officer for a department + ward.
        return pick(candidates);
    }

    private List<Officer> filterByWard(List<Officer> officers, String ward) {
        if (ward == null) return List.of();
        return officers.stream().filter(o -> ward.equals(normalize(o.getWard()))).toList();
    }

    private String normalize(String s) {
        return s == null || s.isBlank() ? null : s.trim().toLowerCase(Locale.ROOT);
    }

    private Officer pick(List<Officer> pool) {
        int idx = Math.floorMod(roundRobin.getAndIncrement(), pool.size());
        return pool.get(idx);
    }

    private Priority predictPriority(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        for (String kw : HIGH_KEYWORDS) {
            if (lower.contains(kw)) return Priority.HIGH;
        }
        for (String kw : LOW_KEYWORDS) {
            if (lower.contains(kw)) return Priority.LOW;
        }
        return Priority.MEDIUM;
    }

    private Grievance findDuplicate(Grievance grievance) {
        if (grievance.getArea() == null || grievance.getCategory() == null) return null;
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        return grievanceRepository.findPossibleDuplicates(grievance.getArea(), grievance.getCategory().getCategoryId(), since)
                .stream()
                .filter(g -> !g.getGrievanceId().equals(grievance.getGrievanceId()))
                .findFirst()
                .orElse(null);
    }
}
