package dev.prateek.banque.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long accountId,
        String paymentType,
        String category,
        BigDecimal amount,
        String currency,
        String reference,
        String payeeName,
        String payeeAccount,
        String description,
        String status,
        LocalDateTime scheduledDate,
        LocalDateTime createdAt
) {}

