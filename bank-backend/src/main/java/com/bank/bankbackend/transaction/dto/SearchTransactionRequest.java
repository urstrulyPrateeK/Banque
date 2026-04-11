package com.bank.bankbackend.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Search transaction request
 */
public record SearchTransactionRequest(
        Long accountId,
        String type,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal minAmount,
        BigDecimal maxAmount
) {}