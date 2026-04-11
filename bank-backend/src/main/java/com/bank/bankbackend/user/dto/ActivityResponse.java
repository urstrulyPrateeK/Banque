package com.bank.bankbackend.user.dto;

import java.time.LocalDateTime;

public record ActivityResponse(
        Long id,
        String action,
        String description,
        String ipAddress,
        String userAgent,
        LocalDateTime createdAt
) {}
