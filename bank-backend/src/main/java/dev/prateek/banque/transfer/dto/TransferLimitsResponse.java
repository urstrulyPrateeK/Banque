package dev.prateek.banque.transfer.dto;

import java.math.BigDecimal;

/**
 * Transfer limits response
 */
public record TransferLimitsResponse(
        BigDecimal maxInternalTransfer,
        BigDecimal maxExternalTransfer,
        BigDecimal dailyLimit
) {}
