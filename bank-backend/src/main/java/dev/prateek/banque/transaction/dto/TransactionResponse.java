package dev.prateek.banque.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction response
 */
public record TransactionResponse(
        Long id,
        Long accountId,
        String transactionType,
        BigDecimal amount,
        String currency,
        String reference,
        String description,
        String status,
        LocalDateTime createdAt
) {}
