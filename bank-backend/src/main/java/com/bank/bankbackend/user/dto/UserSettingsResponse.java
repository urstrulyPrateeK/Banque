package com.bank.bankbackend.user.dto;

public record UserSettingsResponse(
        Long id,
        Long userId,
        boolean emailNotifications,
        boolean smsNotifications,
        boolean pushNotifications,
        boolean transactionNotifications,
        boolean securityNotifications,
        boolean marketingNotifications,
        String language,
        String currency,
        String timeZone,
        String theme,
        String profileVisibility,
        boolean showEmail,
        boolean showPhone,
        boolean mfaEnabled
) {}
