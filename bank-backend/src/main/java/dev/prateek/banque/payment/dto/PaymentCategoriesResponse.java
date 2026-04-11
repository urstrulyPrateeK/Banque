package dev.prateek.banque.payment.dto;

import java.util.List;

public record PaymentCategoriesResponse(
        List<String> categories,
        List<String> types
) {}

