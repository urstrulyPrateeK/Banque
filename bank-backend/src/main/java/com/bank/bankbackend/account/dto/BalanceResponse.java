package com.bank.bankbackend.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Balance response
 */
public record BalanceResponse(
        Long accountId,
        String accountNumber,
        BigDecimal balance,
        String currency,
        LocalDateTime lastUpdated
) {}
