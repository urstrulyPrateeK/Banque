package com.bank.bankbackend.transaction.dto;

import java.math.BigDecimal;

/**
 * Transaction statistics response
 */
public record TransactionStatisticsResponse(
        int totalTransactions,
        BigDecimal totalDeposits,
        BigDecimal totalWithdrawals,
        int depositCount,
        int withdrawalCount,
        int pendingCount,
        int failedCount
) {}