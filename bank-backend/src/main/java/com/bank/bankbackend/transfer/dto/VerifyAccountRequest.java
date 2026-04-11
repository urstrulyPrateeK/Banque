package com.bank.bankbackend.transfer.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Verify account request
 */
public record VerifyAccountRequest(
        @NotBlank(message = "Account number is required")
        String accountNumber
) {}