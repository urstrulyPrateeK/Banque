package com.bank.bankbackend.card.dto;

import jakarta.validation.constraints.*;

public record ChangePinRequest(
        @NotBlank @Size(min = 4, max = 4) String currentPin,
        @NotBlank @Size(min = 4, max = 4) @Pattern(regexp = "\\d{4}") String newPin,
        @NotBlank @Size(min = 4, max = 4) String confirmPin
) {}
