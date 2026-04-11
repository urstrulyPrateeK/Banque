package com.bank.bankbackend.transfer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Scheduled transfer request
 */
public record ScheduledTransferRequest(
        @NotNull(message = "Source account ID is required")
        Long fromAccountId,

        Long toAccountId, // For internal transfer

        String toAccountNumber, // For external transfer

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotNull(message = "Scheduled date is required")
        @Future(message = "Scheduled date must be in the future")
        LocalDate scheduledDate,

        @Size(max = 200, message = "Description must not exceed 200 characters")
        String description
) {}
