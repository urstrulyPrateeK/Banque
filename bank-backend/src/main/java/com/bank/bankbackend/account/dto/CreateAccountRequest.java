package com.bank.bankbackend.account.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * Create account request
 */
public record CreateAccountRequest(
        @NotBlank(message = "Account type is required")
        String accountType,

        @NotBlank(message = "Currency is required")
        @Size(min = 3, max = 3, message = "Currency must be 3 characters")
        String currency,

        @Size(max = 50, message = "Nickname must not exceed 50 characters")
        String nickname
) {}
