package com.bank.bankbackend.payment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringPaymentRequest(
        @NotNull Long accountId,
        @NotBlank String paymentType,
        @NotBlank String category,
        @NotBlank String payeeName,
        String payeeAccount,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank
        @Pattern(regexp = "DAILY|WEEKLY|MONTHLY|QUARTERLY|YEARLY")
        String frequency,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        String description
) {}
