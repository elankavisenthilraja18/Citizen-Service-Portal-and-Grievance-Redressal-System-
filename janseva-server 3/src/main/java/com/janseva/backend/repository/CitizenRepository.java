package com.janseva.backend.repository;

import com.janseva.backend.model.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
    Optional<Citizen> findByEmail(String email);
    Optional<Citizen> findByMobile(String mobile);
    Optional<Citizen> findByEmailOrMobile(String email, String mobile);
    boolean existsByEmail(String email);
    boolean existsByMobile(String mobile);
}
