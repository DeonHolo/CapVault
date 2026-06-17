package edu.cit.capvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
@EnableMethodSecurity
public class CapVaultApplication {
    public static void main(String[] args) {
        SpringApplication.run(CapVaultApplication.class, args);
    }
}
