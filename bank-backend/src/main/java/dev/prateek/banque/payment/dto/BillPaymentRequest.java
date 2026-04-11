package dev.prateek.banque.payment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record BillPaymentRequest(
        @NotNull Long accountId,
        @NotBlank String billerName,
        @NotBlank String category,
        @NotBlank String accountNumber,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String description
) {}

