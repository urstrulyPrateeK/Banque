package dev.prateek.banque.card.dto;

public record CardDetailsResponse(
        Long id,
        String maskedCardNumber,
        String cardholderName,
        String expiryDate,
        String cardType,
        String status,
        boolean onlineTransactionsEnabled,
        boolean contactlessEnabled,
        boolean internationalEnabled
) {}

