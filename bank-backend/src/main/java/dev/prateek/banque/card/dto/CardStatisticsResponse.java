package dev.prateek.banque.card.dto;

public record CardStatisticsResponse(
        int totalCards,
        int activeCards,
        int blockedCards,
        int debitCards,
        int creditCards
) {}

