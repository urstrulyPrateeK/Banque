package com.bank.bankbackend.transfer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Internal transfer request (between own accounts)
 */
public record InternalTransferRequest(
        @NotNull(message = "Source account ID is required")
        Long fromAccountId,

        @NotNull(message = "Destination account ID is required")
        Long toAccountId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @Size(max = 200, message = "Description must not exceed 200 characters")
        String description
) {}
