package com.bank.bankbackend.payment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UtilityPaymentRequest(
        @NotNull Long accountId,
        @NotBlank String providerName,
        @NotBlank String utilityType,
        @NotBlank String meterNumber,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String description
) {}
