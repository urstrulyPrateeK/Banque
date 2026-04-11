package com.bank.bankbackend.transfer.dto;

import java.math.BigDecimal;

/**
 * Transfer statistics response
 */
public record TransferStatisticsResponse(
        int totalTransfers,
        int internalTransfers,
        int externalTransfers,
        BigDecimal totalAmount,
        int completedTransfers,
        int pendingTransfers
) {}