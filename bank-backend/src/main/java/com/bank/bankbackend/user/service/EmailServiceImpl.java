package com.bank.bankbackend.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email service implementation using JavaMailSender
 */
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    // Before for real smtp
    //@Value("${spring.mail.username}")
    //private String fromEmail;

    // After
    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Your OTP Code");
        message.setText(String.format(
                "Hello,\n\n" +
                "Your OTP code is: %s\n\n" +
                "This code will expire in 5 minutes.\n\n" +
                "If you didn't request this code, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Bank Security Team",
                otp
        ));

        mailSender.send(message);
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verificationLink = frontendUrl + "/auth/verify-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Verify Your Email Address");
        message.setText(String.format(
                "Hello,\n\n" +
                "Thank you for registering with our banking platform.\n\n" +
                "Please click the link below to verify your email address:\n" +
                "%s\n\n" +
                "This link will expire in 48 hours.\n\n" +
                "If you didn't create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Bank Team",
                verificationLink
        ));

        mailSender.send(message);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Password Reset Request");
        message.setText(String.format(
                "Hello,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Please click the link below to reset your password:\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't request a password reset, please ignore this email and your password will remain unchanged.\n\n" +
                "Best regards,\n" +
                "Bank Security Team",
                resetLink
        ));

        mailSender.send(message);
    }

    @Override
    public void sendWelcomeEmail(String to, String username) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Welcome to Our Bank");
        message.setText(String.format(
                "Hello %s,\n\n" +
                "Welcome to our banking platform!\n\n" +
                "Your account has been successfully created and verified.\n\n" +
                "You can now login and start using our services.\n\n" +
                "Best regards,\n" +
                "Bank Team",
                username
        ));

        mailSender.send(message);
    }

    @Override
    public void sendPasswordChangedEmail(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("Your Password Has Been Changed");
        message.setText(
                "Hello,\n\n" +
                        "This is a confirmation that your account password has been successfully changed.\n\n" +
                        "If you did not perform this action, please contact our support immediately.\n\n" +
                        "Best regards,\n" +
                        "Bank Security Team"
        );
        mailSender.send(message);
    }

    @Override
    public void sendMfaEnabledEmail(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("MFA Enabled on Your Account");
        message.setText(
                "Hello,\n\n" +
                        "Multi-Factor Authentication (MFA) has been enabled on your account.\n\n" +
                        "This adds an extra layer of security to your account.\n\n" +
                        "If you did not perform this action, please contact our support immediately.\n\n" +
                        "Best regards,\n" +
                        "Bank Security Team"
        );
        mailSender.send(message);
    }

    @Override
    public void sendMfaDisabledEmail(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("MFA Disabled on Your Account");
        message.setText(
                "Hello,\n\n" +
                        "Multi-Factor Authentication (MFA) has been disabled on your account.\n\n" +
                        "If you did not perform this action, please contact our support immediately.\n\n" +
                        "Best regards,\n" +
                        "Bank Security Team"
        );
        mailSender.send(message);
    }
}