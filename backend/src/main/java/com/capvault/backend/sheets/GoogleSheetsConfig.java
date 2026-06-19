package com.capvault.backend.sheets;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GoogleSheetsProperties.class)
public class GoogleSheetsConfig {

    @Bean
    @ConditionalOnMissingBean(GoogleSheetsGateway.class)
    GoogleSheetsGateway disabledGoogleSheetsGateway() {
        return new DisabledGoogleSheetsGateway();
    }
}
