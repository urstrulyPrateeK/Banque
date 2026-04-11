package com.bank.bankbackend.card.dto;

import java.math.BigDecimal;

public record CardLimitsResponse(
        BigDecimal dailyLimit,
        BigDecimal monthlyLimit,
        BigDecimal atmLimit,
        BigDecimal posLimit
) {}
