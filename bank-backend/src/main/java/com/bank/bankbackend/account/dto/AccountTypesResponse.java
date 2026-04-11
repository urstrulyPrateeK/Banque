package com.bank.bankbackend.account.dto;

import java.util.List;

/**
 * Account types response
 */
public record AccountTypesResponse(
        List<String> types
) {}
