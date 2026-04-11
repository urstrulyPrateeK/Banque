package dev.prateek.banque.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Balance history response
 */
public record BalanceHistoryResponse(
        Long id,
        BigDecimal oldBalance,
        BigDecimal newBalance,
        String transactionType,
        String description,
        LocalDateTime recordedAt
) {}


