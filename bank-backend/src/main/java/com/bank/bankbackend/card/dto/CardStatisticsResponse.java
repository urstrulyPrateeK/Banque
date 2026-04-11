package com.bank.bankbackend.card.dto;

public record CardStatisticsResponse(
        int totalCards,
        int activeCards,
        int blockedCards,
        int debitCards,
        int creditCards
) {}
