package com.bank.bankbackend.user.dto;

public record LoginResponse(
        String accessToken,
        String tokenType
) {}