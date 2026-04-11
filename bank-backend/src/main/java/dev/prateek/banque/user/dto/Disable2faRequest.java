package dev.prateek.banque.user.dto;

import jakarta.validation.constraints.NotBlank;

public record Disable2faRequest(

        @NotBlank(message = "Password is required to disable 2FA")
        String password
) {}

