package dev.prateek.banque.user.dto;

public record LoginResponse(
        String accessToken,
        String tokenType
) {}
