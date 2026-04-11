package com.bank.bankbackend.user.dto;

public record TokenValidationResponse(

        boolean valid,
        String username,
        String role
) {
    public static TokenValidationResponse invalid() {
        return new TokenValidationResponse(false, null, null);
    }
}
