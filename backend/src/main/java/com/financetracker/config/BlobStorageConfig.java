package com.financetracker.config;

import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BlobStorageConfig {

    @Bean
    public BlobServiceClient blobServiceClient(
            @Value("${AZURE_STORAGE_CONNECTION_STRING}") String connectionString) {
        return new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
    }
}
