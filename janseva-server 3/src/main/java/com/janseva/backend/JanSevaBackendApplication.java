package com.janseva.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * JanSeva - Citizen Service & Grievance Redressal Portal
 * Backend API entry point.
 */
@SpringBootApplication
@EnableAsync
public class JanSevaBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(JanSevaBackendApplication.class, args);
    }
}
