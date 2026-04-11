package dev.prateek.banque.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthenticationResponse(
        String message,
        String sessionId,
        String accessToken,
        String refreshToken,
        String username,
        String role
) {
    // For password authentication response (MFA required)
    public static AuthenticationResponse mfaRequired(String sessionId) {
        return new AuthenticationResponse(
                "Password verified. OTP sent to your email.",
                sessionId,
                null,
                null,
                null,
                null
        );
    }

    // For successful MFA verification
    public static AuthenticationResponse success(String accessToken, String refreshToken, String username, String role) {
        return new AuthenticationResponse(
                "Authentication successful",
                null,
                accessToken,
                refreshToken,
                username,
                role
        );
    }

    // For registration
    public static AuthenticationResponse registered(String message) {
        return new AuthenticationResponse(
                message,
                null,
                null,
                null,
                null,
                null
        );
    }
}
