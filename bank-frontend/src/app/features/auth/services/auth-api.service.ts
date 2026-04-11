import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    User,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    OtpVerifyRequest,
    VerifyEmailRequest,
    MessageResponse,
    ResetPasswordRequest,
    ResendVerificationRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest
} from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class AuthApiService {
    private readonly api = inject(ApiService);

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('/auth/login', credentials);
    }

    register(userData: RegisterRequest): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('/auth/register', userData);
    }

    verifyOtp(data: OtpVerifyRequest): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('/auth/verify-otp', data);
    }

    resendOtp(sessionId: string): Observable<{ message: string }> {
        // Note: The OpenAPI spec for resend-otp was not provided in the snippet, 
        // but 'resend-verification' is. Assuming resendOtp is distinct or maybe related.
        // Keeping this for now as it's used in the current UI flow which works.
        // The user verified log shows: password verified -> OTP sent.
        // It's likely /auth/login returns sessionId, then we verify-otp.
        return this.api.post<{ message: string }>('/auth/resend-otp', { sessionId });
    }

    verifyEmail(data: VerifyEmailRequest): Observable<MessageResponse> {
        return this.api.post<MessageResponse>('/auth/verify-email', data);
    }

    resendVerification(data: ResendVerificationRequest): Observable<MessageResponse> {
        return this.api.post<MessageResponse>('/auth/resend-verification', data);
    }

    logout(refreshToken?: string): Observable<MessageResponse> {
        // Spec says body is RefreshTokenRequest
        const body = refreshToken ? { refreshToken } : {};
        return this.api.post<MessageResponse>('/auth/logout', body);
    }

    refreshToken(refreshToken: string): Observable<AuthResponse> {
        const body: RefreshTokenRequest = { refreshToken };
        return this.api.post<AuthResponse>('/auth/refresh', body);
    }

    getCurrentUser(): Observable<User> {
        // Not in provided spec but kept for functionality
        return this.api.get<User>('/users/me');
    }

    forgotPassword(email: string): Observable<MessageResponse> {
        const body: ForgotPasswordRequest = { email };
        return this.api.post<MessageResponse>('/auth/forgot-password', body);
    }

    resetPassword(resetToken: string, newPassword: string): Observable<MessageResponse> {
        const body: ResetPasswordRequest = { resetToken, newPassword };
        return this.api.post<MessageResponse>('/auth/reset-password', body);
    }

    checkHealth(): Observable<string> {
        return this.api.get<string>('/auth/health');
    }
}
