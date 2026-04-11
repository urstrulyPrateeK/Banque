// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.document.controller;

import dev.prateek.banque.document.dto.DocumentAccessResponse;
import dev.prateek.banque.document.dto.DocumentUploadResponse;
import dev.prateek.banque.document.service.CloudStorageService;
import dev.prateek.banque.document.service.CloudStorageService.DocumentResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final CloudStorageService cloudStorageService;

    public DocumentController(CloudStorageService cloudStorageService) {
        this.cloudStorageService = cloudStorageService;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "KYC") String documentType
    ) {
        return ResponseEntity.ok(cloudStorageService.uploadDocument(file, documentType));
    }

    @GetMapping("/{userId}/kyc")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DocumentAccessResponse> getLatestKycDocument(@PathVariable Long userId) {
        return ResponseEntity.ok(cloudStorageService.getLatestKycDocument(userId));
    }

    @GetMapping("/files/{documentId}")
    public ResponseEntity<Resource> downloadLocalDocument(
            @PathVariable Long documentId,
            @RequestParam long expiresAt,
            @RequestParam String signature
    ) {
        DocumentResource documentResource = cloudStorageService.downloadLocalDocument(documentId, expiresAt, signature);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, documentResource.contentType())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + documentResource.originalFileName() + "\"")
                .body(documentResource.resource());
    }
}
