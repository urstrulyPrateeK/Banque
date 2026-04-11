package dev.prateek.banque.card.dto;

import java.math.BigDecimal;

public record CardLimitsResponse(
        BigDecimal dailyLimit,
        BigDecimal monthlyLimit,
        BigDecimal atmLimit,
        BigDecimal posLimit
) {}

