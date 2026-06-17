package edu.cit.capvault.security;

import edu.cit.capvault.config.CapVaultProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class InstitutionalEmailValidator {
    private final CapVaultProperties properties;

    public InstitutionalEmailValidator(CapVaultProperties properties) {
        this.properties = properties;
    }

    public boolean isValid(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String domain = properties.institutionalDomain() == null ? "cit.edu" : properties.institutionalDomain();
        return email.toLowerCase(Locale.ROOT).endsWith("@" + domain.toLowerCase(Locale.ROOT));
    }
}
