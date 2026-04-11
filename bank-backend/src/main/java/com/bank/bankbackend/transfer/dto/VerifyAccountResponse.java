package com.bank.bankbackend.transfer.dto;

/**
 * Verify account response
 */
public record VerifyAccountResponse(
        boolean isValid,
        String accountNumber,
        String accountType,
        String message
) {}