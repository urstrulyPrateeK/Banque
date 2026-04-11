package dev.prateek.banque.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Search transaction request
 */
public record SearchTransactionRequest(
        Long accountId,
        String type,
        String status,
        String query,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal minAmount,
        BigDecimal maxAmount
) {}
