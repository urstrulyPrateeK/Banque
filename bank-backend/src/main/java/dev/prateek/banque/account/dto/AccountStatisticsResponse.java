package dev.prateek.banque.account.dto;

import java.math.BigDecimal;

/**
 * Account statistics response
 */
public record AccountStatisticsResponse(
        int savingsAccounts,
        int checkingAccounts,
        int businessAccounts,
        BigDecimal totalBalance,
        BigDecimal savingsBalance,
        BigDecimal checkingBalance
) {}

