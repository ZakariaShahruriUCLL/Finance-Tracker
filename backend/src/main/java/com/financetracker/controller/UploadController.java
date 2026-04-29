package com.financetracker.controller;

import com.financetracker.service.BlobStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final BlobStorageService blobStorageService;

    public record UploadRequest(String filename, String contentType, String data) {}

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(
            @RequestBody UploadRequest request,
            Authentication auth) {
        String ext = StringUtils.getFilenameExtension(request.filename());
        String blobName = auth.getName() + "/" + UUID.randomUUID() + (ext != null ? "." + ext : "");
        byte[] bytes = Base64.getDecoder().decode(request.data());
        String contentType = request.contentType() != null && !request.contentType().isBlank()
                ? request.contentType() : "application/octet-stream";
        blobStorageService.upload(blobName, bytes, contentType);
        return ResponseEntity.ok(Map.of("blobName", blobName));
    }
}
