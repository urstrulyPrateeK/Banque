package com.bank.bankbackend.user.service;

import com.bank.bankbackend.security.jwt.JwtService;
import com.bank.bankbackend.security.jwt.TokenBlacklistService;
import com.bank.bankbackend.security.mfa.MfaSessionService;
import com.bank.bankbackend.security.mfa.OtpService;
import com.bank.bankbackend.security.userdetails.UserDetailsImpl;
import com.bank.bankbackend.user.dto.*;
import com.bank.bankbackend.user.entity.EmailVerificationToken;
import com.bank.bankbackend.user.entity.PasswordResetToken;
import com.bank.bankbackend.user.entity.User;
import com.bank.bankbackend.user.repository.EmailVerificationTokenRepository;
import com.bank.bankbackend.user.repository.PasswordResetTokenRepository;
import com.bank.bankbackend.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final MfaSessionService mfaSessionService;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final TokenBlacklistService tokenBlacklistService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    // Token expiration times (in hours)
    private static final int PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 24;
    private static final int EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 48;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            OtpService otpService,
            MfaSessionService mfaSessionService,
            UserDetailsService userDetailsService,
            EmailService emailService,
            TokenBlacklistService tokenBlacklistService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.otpService = otpService;
        this.mfaSessionService = mfaSessionService;
        this.userDetailsService = userDetailsService;
        this.emailService = emailService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    }

    /**
     * Register new user
     */
    @Transactional
    public AuthenticationResponse register(@Valid RegisterRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create new user
        User user = new User(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password())
        );

        userRepository.save(user);

        // Generate email verification token
        String verificationToken = generateEmailVerificationToken(user);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), verificationToken);

        return AuthenticationResponse.registered("User registered successfully. Please check your email to verify your account.");
    }

    /**
     * Authenticate user with password (Step 1 of MFA)
     */
    public AuthenticationResponse authenticatePassword(@Valid LoginRequest request) {
        // Authenticate with username and password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        // Get user details
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userDetails.getUser();

        // Check if email is verified (optional - uncomment if you want to enforce)
        // if (!user.isEmailVerified()) {
        //     throw new IllegalArgumentException("Please verify your email before logging in");
        // }

        // Check if MFA is enabled
        if (!user.isMfaEnabled()) {
            // MFA not enabled, return tokens directly
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            return AuthenticationResponse.success(
                    accessToken,
                    refreshToken,
                    user.getUsername(),
                    user.getRole()
            );
        }

        // MFA enabled - generate OTP and create session
        String otp = otpService.generateOtp(user.getUsername());
        String sessionId = mfaSessionService.createMfaSession(user.getUsername());

        // Send OTP via email
        emailService.sendOtpEmail(user.getEmail(), otp);

        return AuthenticationResponse.mfaRequired(sessionId);
    }

    /**
     * Verify OTP (Step 2 of MFA)
     */
    public AuthenticationResponse verifyOtp(@Valid VerifyOtpRequest request) {
        // Validate session
        if (!mfaSessionService.isValidSession(request.sessionId())) {
            throw new IllegalArgumentException("Invalid or expired session");
        }

        // Get username from session
        String username = mfaSessionService.getUsernameFromSession(request.sessionId());
        if (username == null) {
            throw new IllegalArgumentException("Session not found");
        }

        // Validate OTP
        if (!otpService.validateOtp(username, request.otp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        // Mark MFA as completed
        mfaSessionService.completeMfaSession(request.sessionId());

        // Load user details
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        User user = ((UserDetailsImpl) userDetails).getUser();

        // Generate JWT tokens
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        // Invalidate session
        mfaSessionService.invalidateSession(request.sessionId());

        return AuthenticationResponse.success(
                accessToken,
                refreshToken,
                user.getUsername(),
                user.getRole()
        );
    }

    /**
     * Refresh access token
     */
    public AuthenticationResponse refreshToken(@Valid RefreshTokenRequest request) {
        // Extract username from refresh token
        String username = jwtService.extractUsername(request.refreshToken());

        // Load user details
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Validate refresh token
        if (!jwtService.isTokenValid(request.refreshToken(), userDetails)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        // Generate new access token
        String accessToken = jwtService.generateToken(userDetails);
        User user = ((UserDetailsImpl) userDetails).getUser();

        return AuthenticationResponse.success(
                accessToken,
                request.refreshToken(),
                user.getUsername(),
                user.getRole()
        );
    }

    /**
     * Logout user
     */
    public void logout(String refreshToken, String accessToken) {
        // 1. Validate and blacklist refresh token
        if (refreshToken != null && jwtService.isRefreshToken(refreshToken)) {
            tokenBlacklistService.blacklistToken(refreshToken);
        }

        // 2. Blacklist access token
        if (accessToken != null) {
            tokenBlacklistService.blacklistToken(accessToken);
        }

        // 3. Clear security context
        SecurityContextHolder.clearContext();
    }

    /**
     * Send password reset token to user's email
     */
    @Transactional
    public void sendPasswordResetToken(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email
    ) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with this email address"));

        // Delete any existing password reset tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate new token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(PASSWORD_RESET_TOKEN_EXPIRY_HOURS);

        // Save token
        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
        passwordResetTokenRepository.save(resetToken);

        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    /**
     * Reset password using reset token
     */
    @Transactional
    public void resetPassword(
            @NotBlank(message = "Reset token is required")
            String token,
            @NotBlank(message = "New password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String newPassword
    ) {
        // Find token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token"));

        // Check if token is expired
        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Password reset token has expired");
        }

        // Check if token has already been used
        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Password reset token has already been used");
        }

        // Get user and update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    /**
     * Verify email using verification token
     */
    @Transactional
    public void verifyEmailToken(
            @NotBlank(message = "Verification token is required")
            String token
    ) {
        // Find token
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        // Check if token is expired
        if (verificationToken.isExpired()) {
            throw new IllegalArgumentException("Verification token has expired");
        }

        // Check if token has already been used
        if (verificationToken.isUsed()) {
            throw new IllegalArgumentException("Email has already been verified");
        }

        // Get user and mark email as verified
        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Mark token as used
        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);
    }

    /**
     * Resend verification email
     */
    @Transactional
    public void resendVerificationEmail(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email
    ) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with this email address"));

        // Check if email is already verified
        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }

        // Delete any existing verification tokens for this user
        emailVerificationTokenRepository.deleteByUser(user);

        // Generate new token
        String token = generateEmailVerificationToken(user);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    /**
     * Helper method to generate email verification token
     */
    private String generateEmailVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS);

        EmailVerificationToken verificationToken = new EmailVerificationToken(token, user, expiryDate);
        emailVerificationTokenRepository.save(verificationToken);

        return token;
    }
}