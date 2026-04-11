package com.bank.bankbackend.payment.dto;

import jakarta.validation.constraints.*;

public record SaveBillerRequest(
        @NotBlank String billerName,
        @NotBlank String category,
        @NotBlank String accountNumber,
        String nickname
) {}
