package dev.prateek.banque.account.dto;

import jakarta.validation.constraints.Size;

/**
 * Update account request
 */
public record UpdateAccountRequest(
        @Size(max = 50, message = "Nickname must not exceed 50 characters")
        String nickname
) {}

