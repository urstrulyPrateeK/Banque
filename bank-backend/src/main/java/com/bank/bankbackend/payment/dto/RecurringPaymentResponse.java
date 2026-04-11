package com.bank.bankbackend.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecurringPaymentResponse(
        Long id,
        Long accountId,
        String paymentType,
        String category,
        BigDecimal amount,
        String currency,
        String frequency,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextExecutionDate,
        String payeeName,
        String payeeAccount,
        String description,
        boolean isActive,
        LocalDateTime createdAt
) {}
