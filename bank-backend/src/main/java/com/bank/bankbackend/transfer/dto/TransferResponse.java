package com.bank.bankbackend.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transfer response
 */
public record TransferResponse(
        Long id,
        Long fromAccountId,
        Long toAccountId,
        String transferType,
        BigDecimal amount,
        String currency,
        String reference,
        String recipientName,
        String description,
        String status,
        LocalDateTime scheduledDate,
        LocalDateTime createdAt
) {}