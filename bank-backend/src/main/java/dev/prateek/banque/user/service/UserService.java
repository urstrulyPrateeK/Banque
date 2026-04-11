package dev.prateek.banque.user.service;

import dev.prateek.banque.security.mfa.OtpService;
import dev.prateek.banque.security.userdetails.UserDetailsImpl;
import dev.prateek.banque.user.dto.*;
import dev.prateek.banque.user.entity.Notification;
import dev.prateek.banque.user.entity.User;
import dev.prateek.banque.user.entity.UserActivity;
import dev.prateek.banque.user.entity.UserSettings;
import dev.prateek.banque.user.repository.NotificationRepository;
import dev.prateek.banque.user.repository.UserActivityRepository;
import dev.prateek.banque.user.repository.UserRepository;
import dev.prateek.banque.user.repository.UserSettingsRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UserActivityRepository userActivityRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;

    // File upload configuration
    private static final String UPLOAD_DIR = "uploads/avatars/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_FILE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif"
    );

    public UserService(
            UserRepository userRepository,
            UserSettingsRepository userSettingsRepository,
            UserActivityRepository userActivityRepository,
            NotificationRepository notificationRepository,
            PasswordEncoder passwordEncoder,
            OtpService otpService,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.userActivityRepository = userActivityRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getUser();
    }

    /**
     * Get current user profile
     */
    public UserResponse getCurrentUserProfile() {
        User user = getCurrentUser();
        return mapToUserResponse(user);
    }

    /**
     * Update entire user profile
     */
    @Transactional
    public UserResponse updateProfile(@Valid UpdateProfileRequest request) {
        User user = getCurrentUser();

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setDateOfBirth(request.dateOfBirth());
        user.setAddress(request.address());
        user.setCity(request.city());
        user.setState(request.state());
        user.setCountry(request.country());
        user.setPostalCode(request.postalCode());

        userRepository.save(user);
        logActivity(user, "PROFILE_UPDATED", "User updated profile");

        return mapToUserResponse(user);
    }


    /**
     * Partial update of user profile
     */
    @Transactional
    public UserResponse partialUpdateProfile(PartialUpdateRequest request) {
        User user = getCurrentUser();

        // Update only non-null fields
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }
        if (request.dateOfBirth() != null) {
            user.setDateOfBirth(request.dateOfBirth());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }
        if (request.city() != null) {
            user.setCity(request.city());
        }
        if (request.state() != null) {
            user.setState(request.state());
        }
        if (request.country() != null) {
            user.setCountry(request.country());
        }
        if (request.postalCode() != null) {
            user.setPostalCode(request.postalCode());
        }

        userRepository.save(user);

        // Log activity
        logActivity(user, "PROFILE_UPDATED", "User partially updated their profile");

        return mapToUserResponse(user);
    }

    /**
     * Delete user account (soft delete)
     */
    @Transactional
    public void deleteAccount(@NotBlank String password) {
        User user = getCurrentUser();

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Soft delete
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Log activity
        logActivity(user, "ACCOUNT_DELETED", "User deleted their account");
    }

    /**
     * Change password
     */
    @Transactional
    public void changePassword(@Valid ChangePasswordRequest request) {
        User user = getCurrentUser();

        // Verify current password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Check if new password is same as current
        if (request.currentPassword().equals(request.newPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        // Verify password confirmation
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Log activity
        logActivity(user, "PASSWORD_CHANGED", "User changed their password");

        // Send notification email
        emailService.sendPasswordChangedEmail(user.getEmail());
    }

    /**
     * Get user settings
     */
    public UserSettingsResponse getUserSettings() {
        User user = getCurrentUser();

        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultSettings(user));

        return mapToUserSettingsResponse(settings, user);
    }

    /**
     * Update user settings
     */
    @Transactional
    public UserSettingsResponse updateSettings(@Valid UpdateSettingsRequest request) {
        User user = getCurrentUser();

        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultSettings(user));

        // Update notification preferences
        settings.setEmailNotifications(request.emailNotifications());
        settings.setSmsNotifications(request.smsNotifications());
        settings.setPushNotifications(request.pushNotifications());
        settings.setTransactionNotifications(request.transactionNotifications());
        settings.setSecurityNotifications(request.securityNotifications());
        settings.setMarketingNotifications(request.marketingNotifications());

        // Update preferences
        settings.setLanguage(request.language());
        settings.setCurrency(request.currency());
        settings.setTimeZone(request.timeZone());
        settings.setTheme(request.theme());

        // Update privacy settings
        settings.setProfileVisibility(request.profileVisibility());
        settings.setShowEmail(request.showEmail());
        settings.setShowPhone(request.showPhone());

        settings.setUpdatedAt(LocalDateTime.now());
        userSettingsRepository.save(settings);

        // Log activity
        logActivity(user, "SETTINGS_UPDATED", "User updated their settings");

        return mapToUserSettingsResponse(settings, user);
    }

    /**
     * Upload avatar
     */
    @Transactional
    public String uploadAvatar(@NotNull MultipartFile file) {
        User user = getCurrentUser();

        // Validate file
        validateAvatarFile(file);

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Delete old avatar if exists
            if (user.getAvatarUrl() != null) {
                deleteAvatarFile(user.getAvatarUrl());
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = user.getId() + "_" + UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update user
            String avatarUrl = "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Log activity
            logActivity(user, "AVATAR_UPLOADED", "User uploaded new avatar");

            return avatarUrl;

        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to upload avatar: " + e.getMessage());
        }
    }

    /**
     * Remove avatar
     */
    @Transactional
    public void removeAvatar() {
        User user = getCurrentUser();

        if (user.getAvatarUrl() != null) {
            // Delete file
            deleteAvatarFile(user.getAvatarUrl());

            // Update user
            user.setAvatarUrl(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Log activity
            logActivity(user, "AVATAR_REMOVED", "User removed their avatar");
        }
    }

    /**
     * Get user activities
     */
    public Page<ActivityResponse> getUserActivities(Pageable pageable) {
        User user = getCurrentUser();

        Page<UserActivity> activities = userActivityRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        return activities.map(this::mapToActivityResponse);
    }

    /**
     * Get notifications
     */
    public Page<NotificationResponse> getNotifications(Boolean unreadOnly, Pageable pageable) {
        User user = getCurrentUser();

        Page<Notification> notifications;

        if (unreadOnly != null && unreadOnly) {
            notifications = notificationRepository
                    .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId(), pageable);
        } else {
            notifications = notificationRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        return notifications.map(this::mapToNotificationResponse);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markNotificationAsRead(@NotNull Long notificationId) {
        User user = getCurrentUser();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        // Verify ownership
        if (!notification.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * Get unread notification count
     */
    public long getUnreadNotificationCount() {
        User user = getCurrentUser();
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    /**
     * Mark all notifications as read
     */
    @Transactional
    public void markAllNotificationsAsRead() {
        User user = getCurrentUser();

        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalse(user.getId());

        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(unreadNotifications);
    }

    /**
     * Enable MFA
     */
    @Transactional
    public MfaSetupResponse enableMfa() {
        User user = getCurrentUser();

        if (user.isMfaEnabled()) {
            throw new IllegalArgumentException("MFA is already enabled");
        }

        // Generate and send OTP
        String otp = otpService.generateOtp(user.getUsername());
        emailService.sendOtpEmail(user.getEmail(), otp);

        // Log activity
        logActivity(user, "MFA_SETUP_INITIATED", "User initiated MFA setup");

        return new MfaSetupResponse(
                "OTP sent to your email. Please verify to enable MFA.",
                user.getEmail()
        );
    }

    /**
     * Verify MFA setup
     */
    @Transactional
    public void verifyMfaSetup(@NotBlank String otp) {
        User user = getCurrentUser();

        if (user.isMfaEnabled()) {
            throw new IllegalArgumentException("MFA is already enabled");
        }

        // Validate OTP
        if (!otpService.validateOtp(user.getUsername(), otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        // Enable MFA
        user.setMfaEnabled(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Log activity
        logActivity(user, "MFA_ENABLED", "User enabled MFA");

        // Send confirmation email
        emailService.sendMfaEnabledEmail(user.getEmail());
    }

    /**
     * Disable MFA
     */
    @Transactional
    public void disableMfa(@NotBlank String password) {
        User user = getCurrentUser();

        if (!user.isMfaEnabled()) {
            throw new IllegalArgumentException("MFA is not enabled");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Disable MFA
        user.setMfaEnabled(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Log activity
        logActivity(user, "MFA_DISABLED", "User disabled MFA");

        // Send notification email
        emailService.sendMfaDisabledEmail(user.getEmail());
    }

    // ==================== Helper Methods ====================

    /**
     * Create default settings for user
     */
    private UserSettings createDefaultSettings(User user) {
        UserSettings settings = new UserSettings(user.getId());
        return userSettingsRepository.save(settings);
    }

    /**
     * Validate avatar file
     */
    private void validateAvatarFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG, PNG, and GIF are allowed");
        }
    }

    /**
     * Delete avatar file from disk
     */
    private void deleteAvatarFile(String avatarUrl) {
        try {
            String filename = avatarUrl.substring(avatarUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR, filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log error but don't throw exception
            System.err.println("Failed to delete avatar file: " + e.getMessage());
        }
    }

    /**
     * Log user activity
     */
    private void logActivity(User user, String action, String description) {
        try {
            String ipAddress = getClientIpAddress();
            String userAgent = getUserAgent();

            UserActivity activity = new UserActivity(
                    user.getId(),
                    action,
                    description,
                    ipAddress,
                    userAgent
            );

            userActivityRepository.save(activity);
        } catch (Exception e) {
            // Log error but don't throw exception
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();

                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }

                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    /**
     * Get user agent
     */
    private String getUserAgent() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    /**
     * Map User to UserResponse
     */
    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getAddress(),
                user.getCity(),
                user.getState(),
                user.getCountry(),
                user.getPostalCode(),
                user.getRole(),
                user.isActive(),
                user.isEmailVerified(),
                user.isMfaEnabled(),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    /**
     * Map UserSettings to UserSettingsResponse
     */
    private UserSettingsResponse mapToUserSettingsResponse(UserSettings settings, User user) {
        return new UserSettingsResponse(
                settings.getId(),
                user.getId(),
                settings.isEmailNotifications(),
                settings.isSmsNotifications(),
                settings.isPushNotifications(),
                settings.isTransactionNotifications(),
                settings.isSecurityNotifications(),
                settings.isMarketingNotifications(),
                settings.getLanguage(),
                settings.getCurrency(),
                settings.getTimeZone(),
                settings.getTheme(),
                settings.getProfileVisibility(),
                settings.isShowEmail(),
                settings.isShowPhone(),
                user.isMfaEnabled()
        );
    }

    /**
     * Map UserActivity to ActivityResponse
     */
    private ActivityResponse mapToActivityResponse(UserActivity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getAction(),
                activity.getDescription(),
                activity.getIpAddress(),
                activity.getUserAgent(),
                activity.getCreatedAt()
        );
    }

    /**
     * Map Notification to NotificationResponse
     */
    private NotificationResponse mapToNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
