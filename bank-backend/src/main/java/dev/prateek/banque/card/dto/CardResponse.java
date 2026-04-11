package dev.prateek.banque.card.dto;

import java.time.LocalDateTime;

public record CardResponse(
        Long id,
        Long accountId,
        String cardType,
        String maskedCardNumber,
        String cardholderName,
        String expiryDate,
        String status,
        LocalDateTime createdAt
) {}

