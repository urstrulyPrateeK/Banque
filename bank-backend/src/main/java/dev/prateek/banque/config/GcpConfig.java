// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@EnableConfigurationProperties(BanqueStorageProperties.class)
public class GcpConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.gcp", name = "enabled", havingValue = "true")
    public Storage banqueStorage(BanqueStorageProperties properties) throws IOException {
        StorageOptions.Builder builder = StorageOptions.newBuilder()
                .setProjectId(properties.getProjectId());

        if (properties.getCredentialsLocation() != null && !properties.getCredentialsLocation().isBlank()) {
            try (InputStream inputStream = Files.newInputStream(Path.of(properties.getCredentialsLocation()))) {
                builder.setCredentials(GoogleCredentials.fromStream(inputStream));
            }
        }

        return builder.build().getService();
    }
}
