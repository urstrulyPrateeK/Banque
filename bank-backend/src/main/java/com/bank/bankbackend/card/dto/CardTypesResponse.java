package com.bank.bankbackend.card.dto;

import java.util.List;

public record CardTypesResponse(
        List<String> types
) {}
