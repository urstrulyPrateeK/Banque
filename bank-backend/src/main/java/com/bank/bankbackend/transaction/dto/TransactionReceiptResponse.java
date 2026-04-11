package com.bank.bankbackend.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction receipt response
 */
public record TransactionReceiptResponse(
        Long transactionId,
        String reference,
        String transactionType,
        BigDecimal amount,
        String currency,
        String description,
        String status,
        String accountNumber,
        String accountType,
        LocalDateTime transactionDate
) {}