// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.document.dto;

import java.time.LocalDateTime;

public record DocumentAccessResponse(
        Long id,
        Long userId,
        String documentType,
        String originalFileName,
        String contentType,
        String storageProvider,
        String accessUrl,
        LocalDateTime uploadedAt
) {
}
