package dev.prateek.banque.payment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record MerchantPaymentRequest(
        @NotNull Long accountId,
        @NotBlank String merchantName,
        @NotBlank String merchantId,
        @NotBlank String category,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String description
) {}

