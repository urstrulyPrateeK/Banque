package dev.prateek.banque.user.dto;

import java.time.LocalDateTime;

public record ActivityResponse(
        Long id,
        String action,
        String description,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {}

