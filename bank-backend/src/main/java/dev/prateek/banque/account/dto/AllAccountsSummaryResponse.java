package dev.prateek.banque.account.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * All accounts summary response
 */
public record AllAccountsSummaryResponse(
        int totalAccounts,
        int activeAccounts,
        BigDecimal totalBalance,
        String primaryAccountNumber,
        List<AccountResponse> accounts
) {}
