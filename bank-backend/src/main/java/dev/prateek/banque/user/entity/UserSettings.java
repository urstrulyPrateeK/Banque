package dev.prateek.banque.user.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")

public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    // Notification preferences
    private boolean emailNotifications = true;
    private boolean smsNotifications = false;
    private boolean pushNotifications = true;
    private boolean transactionNotifications = true;
    private boolean securityNotifications = true;
    private boolean marketingNotifications = false;

    // Preferences
    private String language = "en";
    private String currency = "USD";
    private String timeZone = "UTC";
    private String theme = "light";

    // Privacy
    private String profileVisibility = "PRIVATE";
    private boolean showEmail = false;
    private boolean showPhone = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserSettings(Long userId) {
        this.userId = userId;
    }

    public UserSettings() {

    }

    public UserSettings(Long id, Long userId, boolean emailNotifications, boolean smsNotifications, boolean pushNotifications, boolean transactionNotifications, boolean securityNotifications, boolean marketingNotifications, String language, String currency, String timeZone, String theme, String profileVisibility, boolean showEmail, boolean showPhone, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.emailNotifications = emailNotifications;
        this.smsNotifications = smsNotifications;
        this.pushNotifications = pushNotifications;
        this.transactionNotifications = transactionNotifications;
        this.securityNotifications = securityNotifications;
        this.marketingNotifications = marketingNotifications;
        this.language = language;
        this.currency = currency;
        this.timeZone = timeZone;
        this.theme = theme;
        this.profileVisibility = profileVisibility;
        this.showEmail = showEmail;
        this.showPhone = showPhone;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public boolean isSmsNotifications() {
        return smsNotifications;
    }

    public void setSmsNotifications(boolean smsNotifications) {
        this.smsNotifications = smsNotifications;
    }

    public boolean isPushNotifications() {
        return pushNotifications;
    }

    public void setPushNotifications(boolean pushNotifications) {
        this.pushNotifications = pushNotifications;
    }

    public boolean isTransactionNotifications() {
        return transactionNotifications;
    }

    public void setTransactionNotifications(boolean transactionNotifications) {
        this.transactionNotifications = transactionNotifications;
    }

    public boolean isSecurityNotifications() {
        return securityNotifications;
    }

    public void setSecurityNotifications(boolean securityNotifications) {
        this.securityNotifications = securityNotifications;
    }

    public boolean isMarketingNotifications() {
        return marketingNotifications;
    }

    public void setMarketingNotifications(boolean marketingNotifications) {
        this.marketingNotifications = marketingNotifications;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getProfileVisibility() {
        return profileVisibility;
    }

    public void setProfileVisibility(String profileVisibility) {
        this.profileVisibility = profileVisibility;
    }

    public boolean isShowEmail() {
        return showEmail;
    }

    public void setShowEmail(boolean showEmail) {
        this.showEmail = showEmail;
    }

    public boolean isShowPhone() {
        return showPhone;
    }

    public void setShowPhone(boolean showPhone) {
        this.showPhone = showPhone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

