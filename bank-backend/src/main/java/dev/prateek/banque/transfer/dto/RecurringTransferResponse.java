package dev.prateek.banque.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Recurring transfer response
 */
public record RecurringTransferResponse(
        Long id,
        Long fromAccountId,
        Long toAccountId,
        String transferType,
        BigDecimal amount,
        String currency,
        String frequency,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextExecutionDate,
        String description,
        boolean isActive,
        LocalDateTime createdAt
) {}

