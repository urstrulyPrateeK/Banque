package dev.prateek.banque.payment.dto;

import java.math.BigDecimal;

public record PaymentStatisticsResponse(
        int totalPayments,
        int billPayments,
        int utilityPayments,
        int merchantPayments,
        BigDecimal totalAmount,
        int completedPayments,
        int pendingPayments
) {}

