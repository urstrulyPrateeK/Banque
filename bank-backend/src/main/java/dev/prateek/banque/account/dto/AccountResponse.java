package dev.prateek.banque.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;


/**
 * Account response
 */
public record AccountResponse(
        Long id,
        String accountNumber,
        String accountType,
        BigDecimal balance,
        String currency,
        String status,
        String nickname,
        boolean isPrimary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}



