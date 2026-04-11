package dev.prateek.banque.card.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CardTransactionResponse(
        Long id,
        String merchantName,
        String transactionType,
        BigDecimal amount,
        String currency,
        String status,
        LocalDateTime createdAt
) {}

