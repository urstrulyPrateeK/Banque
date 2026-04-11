package com.bank.bankbackend.transfer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * External transfer request (to another user's account)
 */
public record ExternalTransferRequest(
        @NotNull(message = "Source account ID is required")
        Long fromAccountId,

        @NotBlank(message = "Destination account number is required")
        String toAccountNumber,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Recipient name is required")
        @Size(max = 100, message = "Recipient name must not exceed 100 characters")
        String recipientName,

        @Size(max = 200, message = "Description must not exceed 200 characters")
        String description
) {}