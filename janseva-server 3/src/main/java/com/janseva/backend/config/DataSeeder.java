package com.janseva.backend.config;

import com.janseva.backend.enums.AccountStatus;
import com.janseva.backend.enums.Role;
import com.janseva.backend.model.*;
import com.janseva.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Seeds baseline reference data (departments, services, grievance categories)
 * and one demo account per role so the API is usable immediately after
 * `mvn spring-boot:run` - no manual setup required.
 *
 * All demo officer passwords are "Passw0rd!" (first_login = false, so no
 * forced reset is needed for testing). In production, remove this seeder or
 * gate it behind a "dev"-only profile check.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final GovServiceRepository govServiceRepository;
    private final GrievanceCategoryRepository grievanceCategoryRepository;
    private final OfficerRepository officerRepository;
    private final CitizenRepository citizenRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEMO_PASSWORD = "Passw0rd!";

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking JanSeva reference data & grievance officer mappings...");

        Map<String, Department> departments = ensureDepartments();
        if (govServiceRepository.count() == 0) seedServices(departments);
        if (grievanceCategoryRepository.count() == 0) seedGrievanceCategories(departments);

        // Idempotent: fixes existing databases too. Older versions skipped the
        // whole seeder when departments already existed.
        ensureOfficers(departments);
        ensureCitizen();

        log.info("Officer mapping ready: 1 Department Officer + 14 Field Officers per department.");
        log.info("Demo officer password: {}", DEMO_PASSWORD);
    }

    private Map<String, Department> ensureDepartments() {
        String[] names = {
                "Municipal Engineering", "Revenue Department", "Public Works Department",
                "Electricity Board", "Social Welfare Department", "Registration Department",
                "Sanitation Department", "Town Planning Department", "Public Health Department",
                "Grievance Cell"
        };
        Map<String, Department> map = new LinkedHashMap<>();
        for (String name : names) {
            Department department = departmentRepository.findByDepartmentNameIgnoreCase(name)
                    .orElseGet(() -> departmentRepository.save(Department.builder()
                            .departmentName(name)
                            .description(name + " - JanSeva")
                            .contactEmail(name.toLowerCase(java.util.Locale.ROOT).replace(" ", ".") + "@janseva.gov.in")
                            .build()));
            map.put(name, department);
        }
        return map;
    }

    private void seedServices(Map<String, Department> dept) {
        record Svc(String name, int sla, String docs, Department department) {}
        Department revenue = dept.get("Revenue Department");
        Department registration = dept.get("Registration Department");
        Department social = dept.get("Social Welfare Department");
        Department municipal = dept.get("Municipal Engineering");
        Department pwd = dept.get("Public Works Department");
        Department electricity = dept.get("Electricity Board");

        Svc[] services = {
                new Svc("Birth Certificate", 7, "Hospital Record,Aadhaar Card,Address Proof", revenue),
                new Svc("Death Certificate", 5, "Hospital/Medical Certificate,Aadhaar Card", revenue),
                new Svc("Income Certificate", 10, "Aadhaar Card,Salary Slip / Income Proof,Address Proof", revenue),
                new Svc("Community Certificate", 10, "Aadhaar Card,Ration Card,Community Proof", revenue),
                new Svc("Nativity Certificate", 7, "Aadhaar Card,Birth Certificate,Address Proof", revenue),
                new Svc("Residence Certificate", 7, "Aadhaar Card,EB Bill / Ration Card", revenue),
                new Svc("Marriage Certificate", 12, "Aadhaar Card (both parties),Marriage Invitation,Photographs", registration),
                new Svc("Pension", 21, "Aadhaar Card,Age Proof,Bank Passbook", social),
                new Svc("Trade License", 15, "Aadhaar Card,Shop Address Proof,NOC", municipal),
                new Svc("Water Connection", 14, "Aadhaar Card,Property Document,Address Proof", pwd),
                new Svc("Electricity Connection", 14, "Aadhaar Card,Property Document,Address Proof", electricity),
        };
        for (Svc s : services) {
            govServiceRepository.save(GovService.builder()
                    .serviceName(s.name())
                    .department(s.department())
                    .slaDays(s.sla())
                    .requiredDocuments(s.docs())
                    .feeAmount(BigDecimal.ZERO)
                    .isActive(true)
                    .build());
        }
    }

    private void seedGrievanceCategories(Map<String, Department> dept) {
        record Cat(String name, int sla, Department department) {}
        Cat[] cats = {
                new Cat("Road & Infrastructure", 9, dept.get("Municipal Engineering")),
                new Cat("Water Supply", 3, dept.get("Public Works Department")),
                new Cat("Sanitation & Garbage", 2, dept.get("Sanitation Department")),
                new Cat("Street Lighting", 4, dept.get("Electricity Board")),
                new Cat("Drainage", 6, dept.get("Municipal Engineering")),
                new Cat("Public Health", 3, dept.get("Public Health Department")),
                new Cat("Illegal Construction", 12, dept.get("Town Planning Department")),
                new Cat("Electricity", 2, dept.get("Electricity Board")),
                new Cat("Other", 7, dept.get("Grievance Cell")),
        };
        for (Cat c : cats) {
            grievanceCategoryRepository.save(GrievanceCategory.builder()
                    .categoryName(c.name())
                    .defaultDepartment(c.department())
                    .slaDays(c.sla())
                    .build());
        }
    }

    /**
     * Complete demo jurisdiction:
     *   Department -> one active Department Officer
     *   Department + Ward 1..14 -> one active Field Officer
     *
     * Safe on an existing database: existing active mappings are preserved and
     * only missing mappings are created.
     */
    private void ensureOfficers(Map<String, Department> dept) {
        String pw = passwordEncoder.encode(DEMO_PASSWORD);

        Officer admin = officerRepository.findByEmployeeId("ADM20260001").orElseGet(() ->
                officerRepository.save(Officer.builder()
                        .employeeId("ADM20260001").name("System Administrator")
                        .email("admin@janseva.gov.in").phone("9999900001")
                        .role(Role.ADMINISTRATOR).department(dept.get("Grievance Cell"))
                        .district("Coimbatore").passwordHash(pw).firstLogin(false).isActive(true)
                        .build()));

        ensureFixedOfficer("VAO20260001", "Elumalai S.", "elumalai.vao@janseva.gov.in", "9999900002",
                Role.VAO, dept.get("Revenue Department"), "Ward 14", admin, pw);
        ensureFixedOfficer("RI20260001", "Manikandan P.", "manikandan.ri@janseva.gov.in", "9999900003",
                Role.RI, dept.get("Revenue Department"), null, admin, pw);
        ensureFixedOfficer("TAH20260001", "Revathi N.", "revathi.tahsildar@janseva.gov.in", "9999900004",
                Role.TAHSILDAR, dept.get("Revenue Department"), null, admin, pw);
        ensureFixedOfficer("GRO20260001", "Aravind M.", "aravind.grievance@janseva.gov.in", "9999900007",
                Role.GRIEVANCE_OFFICER, dept.get("Grievance Cell"), null, admin, pw);

        int departmentIndex = 1;
        int fieldIndex = 1;
        for (Department department : dept.values()) {
            ensureDepartmentOfficer(department, departmentIndex, admin, pw);
            for (int wardNumber = 1; wardNumber <= 14; wardNumber++) {
                ensureFieldOfficer(department, wardNumber, departmentIndex, fieldIndex++, admin, pw);
            }
            departmentIndex++;
        }
    }

    private void ensureFixedOfficer(String employeeId, String name, String email, String phone,
                                    Role role, Department department, String ward, Officer admin, String pw) {
        if (officerRepository.findByEmployeeId(employeeId).isPresent()) return;
        officerRepository.save(Officer.builder()
                .employeeId(employeeId).name(name).email(email).phone(phone)
                .role(role).department(department).district("Coimbatore")
                .taluk(role == Role.VAO ? "Coimbatore North" : null).ward(ward)
                .passwordHash(pw).firstLogin(false).isActive(true).createdBy(admin)
                .build());
    }

    private void ensureDepartmentOfficer(Department department, int departmentIndex, Officer admin, String pw) {
        boolean exists = officerRepository
                .findByRoleAndDepartment_DepartmentId(Role.DEPARTMENT_OFFICER, department.getDepartmentId())
                .stream().anyMatch(Officer::isActive);
        if (exists) return;

        String suffix = String.format("%02d", departmentIndex);
        officerRepository.save(Officer.builder()
                .employeeId("DPT26D" + suffix)
                .name(department.getDepartmentName() + " Officer")
                .email("dept.d" + suffix + "@janseva.gov.in")
                .phone(String.format("91%08d", departmentIndex))
                .role(Role.DEPARTMENT_OFFICER).department(department)
                .district("Coimbatore")
                .passwordHash(pw).firstLogin(false).isActive(true).createdBy(admin)
                .build());
    }

    private void ensureFieldOfficer(Department department, int wardNumber, int departmentIndex,
                                    int fieldIndex, Officer admin, String pw) {
        String ward = "Ward " + wardNumber;
        boolean exists = officerRepository
                .findByRoleAndDepartment_DepartmentId(Role.FIELD_OFFICER, department.getDepartmentId())
                .stream()
                .filter(Officer::isActive)
                .anyMatch(o -> o.getWard() != null && ward.equalsIgnoreCase(o.getWard().trim()));
        if (exists) return;

        String d = String.format("%02d", departmentIndex);
        String w = String.format("%02d", wardNumber);
        officerRepository.save(Officer.builder()
                .employeeId("FLD26D" + d + "W" + w)
                .name(department.getDepartmentName() + " - " + ward + " Field Officer")
                .email("field.d" + d + ".w" + w + "@janseva.gov.in")
                .phone(String.format("92%08d", fieldIndex))
                .role(Role.FIELD_OFFICER).department(department)
                .district("Coimbatore").ward(ward)
                .passwordHash(pw).firstLogin(false).isActive(true).createdBy(admin)
                .build());
    }

    private void ensureCitizen() {
        if (citizenRepository.existsByMobile("9876543210")) return;
        citizenRepository.save(Citizen.builder()
                .fullName("Karthik R.")
                .mobile("9876543210")
                .email("karthik.r@email.com")
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .district("Coimbatore").ward("Ward 14")
                .languagePreference("en")
                .status(AccountStatus.ACTIVE)
                .build());
    }
}
