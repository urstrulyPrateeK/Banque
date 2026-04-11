package com.bank.bankbackend.payment.dto;

import java.time.LocalDateTime;

public record SavedBillerResponse(
        Long id,
        String billerName,
        String category,
        String accountNumber,
        String nickname,
        LocalDateTime createdAt
) {}
