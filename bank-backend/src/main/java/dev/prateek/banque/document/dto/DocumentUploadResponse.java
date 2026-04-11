// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.document.dto;

import java.time.LocalDateTime;

public record DocumentUploadResponse(
        Long id,
        Long userId,
        String documentType,
        String originalFileName,
        String storageProvider,
        String accessUrl,
        LocalDateTime uploadedAt
) {
}
