package com.capvault.backend.health;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping
    HealthResponse health() {
        List<String> profiles = Arrays.asList(environment.getActiveProfiles());
        return new HealthResponse("UP", "capvault-backend", profiles, Instant.now());
    }
}
