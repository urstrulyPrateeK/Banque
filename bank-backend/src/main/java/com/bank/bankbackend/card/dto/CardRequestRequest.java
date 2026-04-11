package com.bank.bankbackend.card.dto;

import jakarta.validation.constraints.*;

public record CardRequestRequest(
        @NotNull Long accountId,
        @NotBlank @Pattern(regexp = "DEBIT|CREDIT|PREPAID") String cardType
) {}
