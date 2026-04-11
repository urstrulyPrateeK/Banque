package com.bank.bankbackend.security.mfa;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MfaSessionService {

    private static final int SESSION_VALIDITY_MINUTES = 5;
    
    private final Map<String, MfaSession> sessionStore = new ConcurrentHashMap<>();

    /**
     * Create MFA session after successful password authentication
     */
    public String createMfaSession(String username) {
        String sessionId = UUID.randomUUID().toString();
        MfaSession session = new MfaSession(
                username,
                LocalDateTime.now().plusMinutes(SESSION_VALIDITY_MINUTES),
                false
        );
        sessionStore.put(sessionId, session);
        cleanExpiredSessions();
        return sessionId;
    }

    /**
     * Verify MFA session exists and is valid
     */
    public boolean isValidSession(String sessionId) {
        MfaSession session = sessionStore.get(sessionId);
        if (session == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(session.expiryTime())) {
            sessionStore.remove(sessionId);
            return false;
        }

        return true;
    }

    /**
     * Get username from session
     */
    public String getUsernameFromSession(String sessionId) {
        MfaSession session = sessionStore.get(sessionId);
        return session != null ? session.username() : null;
    }

    /**
     * Mark session as MFA completed
     */
    public void completeMfaSession(String sessionId) {
        MfaSession session = sessionStore.get(sessionId);
        if (session != null) {
            MfaSession updatedSession = new MfaSession(
                    session.username(),
                    session.expiryTime(),
                    true
            );
            sessionStore.put(sessionId, updatedSession);
        }
    }

    /**
     * Check if MFA is completed for session
     */
    public boolean isMfaCompleted(String sessionId) {
        MfaSession session = sessionStore.get(sessionId);
        return session != null && session.mfaCompleted();
    }

    /**
     * Invalidate session
     */
    public void invalidateSession(String sessionId) {
        sessionStore.remove(sessionId);
    }

    /**
     * Clean expired sessions
     */
    private void cleanExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        sessionStore.entrySet().removeIf(entry -> 
            now.isAfter(entry.getValue().expiryTime())
        );
    }

    /**
     * Internal record to store MFA session data
     */
    private record MfaSession(
            String username,
            LocalDateTime expiryTime,
            boolean mfaCompleted
    ) {}
}