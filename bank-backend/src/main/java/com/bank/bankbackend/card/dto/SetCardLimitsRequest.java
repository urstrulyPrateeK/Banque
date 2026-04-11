package com.bank.bankbackend.card.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SetCardLimitsRequest(
        @NotNull @DecimalMin("0") BigDecimal dailyLimit,
        @NotNull @DecimalMin("0") BigDecimal monthlyLimit,
        @NotNull @DecimalMin("0") BigDecimal atmLimit,
        @NotNull @DecimalMin("0") BigDecimal posLimit
) {}
