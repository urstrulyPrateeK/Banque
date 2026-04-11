package dev.prateek.banque.transaction.dto;

import java.util.List;

/**
 * Transaction categories response
 */
public record TransactionCategoriesResponse(
        List<String> types,
        List<String> statuses
) {}

