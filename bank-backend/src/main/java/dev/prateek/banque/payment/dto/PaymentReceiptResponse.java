package dev.prateek.banque.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentReceiptResponse(
        Long paymentId,
        String reference,
        String paymentType,
        String category,
        BigDecimal amount,
        String currency,
        String payeeName,
        String payeeAccount,
        String description,
        String status,
        String fromAccountNumber,
        LocalDateTime paymentDate
) {}

