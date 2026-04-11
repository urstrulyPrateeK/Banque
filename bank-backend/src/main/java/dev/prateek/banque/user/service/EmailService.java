package dev.prateek.banque.user.service;

/**
 * Email service interface for sending various types of emails
 */
public interface EmailService {
    
    /**
     * Send OTP email for MFA
     */
    void sendOtpEmail(String to, String otp);
    
    /**
     * Send email verification email
     */
    void sendVerificationEmail(String to, String token);
    
    /**
     * Send password reset email
     */
    void sendPasswordResetEmail(String to, String token);
    
    /**
     * Send welcome email
     */
    void sendWelcomeEmail(String to, String username);

    void sendPasswordChangedEmail(String email);

    void sendMfaEnabledEmail(String email);

    void sendMfaDisabledEmail(String email);
}
