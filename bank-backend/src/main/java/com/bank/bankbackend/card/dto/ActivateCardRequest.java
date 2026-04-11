package com.bank.bankbackend.card.dto;

import jakarta.validation.constraints.*;

public record ActivateCardRequest(
        @NotBlank @Size(min = 3, max = 3) String cvv,
        @NotBlank @Size(min = 4, max = 4) @Pattern(regexp = "\\d{4}") String pin
) {}
