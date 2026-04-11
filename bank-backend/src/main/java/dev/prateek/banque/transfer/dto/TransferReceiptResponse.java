package dev.prateek.banque.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transfer receipt response
 */
public record TransferReceiptResponse(
        Long transferId,
        String reference,
        String transferType,
        BigDecimal amount,
        String currency,
        String fromAccountNumber,
        String toAccountNumber,
        String recipientName,
        String description,
        String status,
        LocalDateTime transferDate
) {}
