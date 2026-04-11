export type UserRole = 'USER' | 'ADMIN';

// --- Auth Related ---

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user?: User; // This might reference the simpler User or full UserResponse. Using shared User interface below.
    accessToken?: string;
    refreshToken?: string;
    mfaRequired?: boolean;
    sessionId?: string;
    message?: string;
    username?: string;
    role?: string;
}

export interface OtpVerifyRequest {
    sessionId: string;
    otp: string;
}

export interface VerifyEmailRequest {
    verificationToken: string;
}

export interface MessageResponse {
    message: string;
}

export interface ResetPasswordRequest {
    resetToken: string;
    newPassword: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

// --- User Profile & Settings ---

export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string; // date format YYYY-MM-DD
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    role: UserRole; // or string if dynamic
    active: boolean;
    emailVerified: boolean;
    mfaEnabled: boolean;
    avatarUrl?: string;
    createdAt: string; // date-time
    updatedAt?: string; // date-time
}

// Re-export User as UserResponse for clarity if needed, or just use User
export type UserResponse = User;

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    email?: string; // Optional in some contexts, but required in spec? Spec says properties exist, doesn't explicitly say all required except min/max.
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface PartialUpdateRequest {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// --- MFA Management ---

export interface VerifyMfaRequest {
    otp: string;
}

export interface MfaSetupResponse {
    message: string;
    email: string;
}

export interface DisableMfaRequest {
    password: string;
}

// --- Settings ---

export interface UserSettings {
    // Flattened structure based on UserSettingsResponse
    id: number;
    userId: number;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    transactionNotifications: boolean;
    securityNotifications: boolean;
    marketingNotifications: boolean;
    language: string;
    currency: string;
    timeZone: string;
    theme: string;
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    mfaEnabled?: boolean; // Included in response
}

export type UserSettingsResponse = UserSettings;

export interface UpdateSettingsRequest {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    transactionNotifications?: boolean;
    securityNotifications?: boolean;
    marketingNotifications?: boolean;
    language: string;
    currency: string;
    timeZone: string;
    theme: string;
    profileVisibility: string;
    showEmail?: boolean;
    showPhone?: boolean;
}

// --- Notifications ---

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string; // INFO, WARNING, SUCCESS, ERROR etc.
    read: boolean;
    createdAt: string;
    readAt?: string;
}

export interface PageNotificationResponse {
    content: Notification[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // current page
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface UnreadCountResponse {
    count: number;
}

// --- Activities ---

export interface Activity {
    id: number;
    action: string;
    description: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

export interface PageActivityResponse {
    content: Activity[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

// --- Common ---
