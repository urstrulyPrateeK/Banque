package dev.prateek.banque.user.controller;

import dev.prateek.banque.user.dto.*;
import dev.prateek.banque.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Get current user profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        try {
            UserResponse response = userService.getCurrentUserProfile();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update entire user profile
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        try {
            UserResponse response = userService.updateProfile(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Partial update of user profile
     */
    @PatchMapping("/me")
    public ResponseEntity<UserResponse> partialUpdateProfile(
            @RequestBody PartialUpdateRequest request
    ) {
        try {
            UserResponse response = userService.partialUpdateProfile(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete user account (soft delete)
     */
    @DeleteMapping("/me")
    public ResponseEntity<MessageResponse> deleteAccount(
            @RequestParam String password
    ) {
        try {
            userService.deleteAccount(password);
            return ResponseEntity.ok(new MessageResponse("Account deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Change password
     */
    @PutMapping("/me/password")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        try {
            userService.changePassword(request);
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get user settings
     */
    @GetMapping("/me/settings")
    public ResponseEntity<UserSettingsResponse> getSettings() {
        try {
            UserSettingsResponse response = userService.getUserSettings();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update user settings
     */
    @PutMapping("/me/settings")
    public ResponseEntity<UserSettingsResponse> updateSettings(
            @Valid @RequestBody UpdateSettingsRequest request
    ) {
        try {
            UserSettingsResponse response = userService.updateSettings(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Upload avatar/profile picture
     */
    @PostMapping("/me/avatar")
    public ResponseEntity<MessageResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String avatarUrl = userService.uploadAvatar(file);
            return ResponseEntity.ok(new MessageResponse("Avatar uploaded successfully: " + avatarUrl));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Remove avatar/profile picture
     */
    @DeleteMapping("/me/avatar")
    public ResponseEntity<MessageResponse> removeAvatar() {
        try {
            userService.removeAvatar();
            return ResponseEntity.ok(new MessageResponse("Avatar removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to remove avatar"));
        }
    }

    /**
     * Get user activity history
     */
    @GetMapping("/me/activities")
    public ResponseEntity<Page<ActivityResponse>> getActivities(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<ActivityResponse> activities = userService.getUserActivities(pageable);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get user notifications
     */
    @GetMapping("/me/notifications")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<NotificationResponse> notifications = userService.getNotifications(unreadOnly, pageable);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark notification as read
     */
    @PutMapping("/me/notifications/{id}/read")
    public ResponseEntity<MessageResponse> markNotificationAsRead(
            @PathVariable Long id
    ) {
        try {
            userService.markNotificationAsRead(id);
            return ResponseEntity.ok(new MessageResponse("Notification marked as read"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Enable MFA/2FA
     */
    @PostMapping("/me/mfa/enable")
    public ResponseEntity<MfaSetupResponse> enableMfa() {
        try {
            MfaSetupResponse response = userService.enableMfa();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Verify MFA setup with OTP
     */
    @PostMapping("/me/mfa/verify")
    public ResponseEntity<MessageResponse> verifyMfaSetup(
            @Valid @RequestBody VerifyMfaRequest request
    ) {
        try {
            userService.verifyMfaSetup(request.otp());
            return ResponseEntity.ok(new MessageResponse("MFA enabled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Disable MFA/2FA
     */
    @PostMapping("/me/mfa/disable")
    public ResponseEntity<MessageResponse> disableMfa(
            @Valid @RequestBody DisableMfaRequest request
    ) {
        try {
            userService.disableMfa(request.password());
            return ResponseEntity.ok(new MessageResponse("MFA disabled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/me/notifications/unread/count")
    public ResponseEntity<UnreadCountResponse> getUnreadNotificationCount() {
        try {
            long count = userService.getUnreadNotificationCount();
            return ResponseEntity.ok(new UnreadCountResponse(count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark all notifications as read
     */
    @PutMapping("/me/notifications/read-all")
    public ResponseEntity<MessageResponse> markAllNotificationsAsRead() {
        try {
            userService.markAllNotificationsAsRead();
            return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to mark notifications as read"));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("User service is running");
    }
}
