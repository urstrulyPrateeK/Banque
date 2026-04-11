package dev.prateek.banque.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSettingsRequest(
        boolean emailNotifications,
        boolean smsNotifications,
        boolean pushNotifications,
        boolean transactionNotifications,
        boolean securityNotifications,
        boolean marketingNotifications,
        @NotBlank String language,
        @NotBlank String currency,
        @NotBlank String timeZone,
        @NotBlank String theme,
        @NotBlank String profileVisibility,
        boolean showEmail,
        boolean showPhone
) {}

