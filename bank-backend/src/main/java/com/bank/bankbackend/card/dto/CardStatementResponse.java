package com.bank.bankbackend.card.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CardStatementResponse(
        String last4Digits,
        String cardType,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalSpent,
        int transactionCount,
        String currency
) {}
