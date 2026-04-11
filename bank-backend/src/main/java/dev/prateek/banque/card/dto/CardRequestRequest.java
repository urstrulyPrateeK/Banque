package dev.prateek.banque.card.dto;

import jakarta.validation.constraints.*;

public record CardRequestRequest(
        @NotNull Long accountId,
        @NotBlank @Pattern(regexp = "DEBIT|CREDIT|PREPAID") String cardType
) {}

