package dev.prateek.banque.account.dto;

import java.math.BigDecimal;

/**
 * Account summary response
 */
public record AccountSummaryResponse(
        Long accountId,
        String accountNumber,
        BigDecimal currentBalance,
        int transactionCount,
        BigDecimal totalCredits,
        BigDecimal totalDebits,
        BigDecimal averageBalance,
        String currency
) {}
