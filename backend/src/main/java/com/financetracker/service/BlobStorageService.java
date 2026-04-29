package com.financetracker.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.time.OffsetDateTime;

@Service
public class BlobStorageService {

    @Value("${azure.storage.container-name:receipts}")
    private String containerName;

    private final BlobServiceClient blobServiceClient;

    public BlobStorageService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    public void upload(String blobName, byte[] data, String contentType) {
        BlobContainerClient container = blobServiceClient.getBlobContainerClient(containerName);
        container.createIfNotExists();
        BlobClient blob = container.getBlobClient(blobName);
        blob.upload(new ByteArrayInputStream(data), data.length, true);
        blob.setHttpHeaders(new BlobHttpHeaders().setContentType(contentType));
    }

    public String generateSasUrl(String blobName) {
        BlobClient blob = blobServiceClient
                .getBlobContainerClient(containerName)
                .getBlobClient(blobName);
        BlobSasPermission permission = new BlobSasPermission().setReadPermission(true);
        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(
                OffsetDateTime.now().plusHours(1), permission);
        return blob.getBlobUrl() + "?" + blob.generateSas(values);
    }

    public void deleteIfExists(String blobName) {
        blobServiceClient.getBlobContainerClient(containerName)
                .getBlobClient(blobName)
                .deleteIfExists();
    }
}
