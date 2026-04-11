package dev.prateek.banque.transfer.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Recurring transfer request
 */
public record RecurringTransferRequest(
        @NotNull(message = "Source account ID is required")
        Long fromAccountId,

        Long toAccountId, // For internal transfer

        String toAccountNumber, // For external transfer

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Frequency is required")
        @Pattern(regexp = "DAILY|WEEKLY|BIWEEKLY|MONTHLY|QUARTERLY|YEARLY",
                message = "Frequency must be DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, or YEARLY")
        String frequency,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @Future(message = "End date must be in the future")
        LocalDate endDate,

        @Size(max = 200, message = "Description must not exceed 200 characters")
        String description
) {}

