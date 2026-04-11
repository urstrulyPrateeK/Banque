package dev.prateek.banque.user.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(

        @NotBlank(message = "Verification token is required")
        String verificationToken
) {}

