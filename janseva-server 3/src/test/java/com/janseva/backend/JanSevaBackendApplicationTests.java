package com.janseva.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class JanSevaBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the full Spring context (JPA, Security, controllers, etc.)
        // wires up correctly against the in-memory H2 database.
    }
}
