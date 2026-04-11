package com.bank.bankbackend.account.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Statement response
 */
public record StatementResponse(
        String accountNumber,
        String accountType,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal openingBalance,
        BigDecimal closingBalance,
        BigDecimal totalCredits,
        BigDecimal totalDebits,
        int totalTransactions,
        String currency
) {}
