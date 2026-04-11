import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    UserResponse,
    UpdateProfileRequest,
    PartialUpdateRequest,
    MessageResponse,
    UserSettingsResponse,
    UpdateSettingsRequest,
    ChangePasswordRequest,
    VerifyMfaRequest,
    MfaSetupResponse,
    DisableMfaRequest,
    PageNotificationResponse,
    UnreadCountResponse,
    PageActivityResponse,
} from '@core/models';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class UserApiService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = '/users';

    // --- Profile ---

    getCurrentUser(): Observable<UserResponse> {
        return this.api.get<UserResponse>(`${this.baseUrl}/me`);
    }

    updateProfile(data: UpdateProfileRequest): Observable<UserResponse> {
        return this.api.put<UserResponse>(`${this.baseUrl}/me`, data);
    }

    partialUpdateProfile(data: PartialUpdateRequest): Observable<UserResponse> {
        return this.api.patch<UserResponse>(`${this.baseUrl}/me`, data);
    }

    deleteAccount(password: string): Observable<MessageResponse> {
        return this.api.delete<MessageResponse>(`${this.baseUrl}/me?password=${encodeURIComponent(password)}`);
    }

    // --- Settings ---

    getSettings(): Observable<UserSettingsResponse> {
        return this.api.get<UserSettingsResponse>(`${this.baseUrl}/me/settings`);
    }

    updateSettings(data: UpdateSettingsRequest): Observable<UserSettingsResponse> {
        return this.api.put<UserSettingsResponse>(`${this.baseUrl}/me/settings`, data);
    }

    changePassword(data: ChangePasswordRequest): Observable<MessageResponse> {
        return this.api.put<MessageResponse>(`${this.baseUrl}/me/password`, data);
    }

    // --- MFA Management ---

    enableMfa(): Observable<MfaSetupResponse> {
        return this.api.post<MfaSetupResponse>(`${this.baseUrl}/me/mfa/enable`, {});
    }

    verifyMfaSetup(data: VerifyMfaRequest): Observable<MessageResponse> {
        return this.api.post<MessageResponse>(`${this.baseUrl}/me/mfa/verify`, data);
    }

    disableMfa(data: DisableMfaRequest): Observable<MessageResponse> {
        return this.api.post<MessageResponse>(`${this.baseUrl}/me/mfa/disable`, data);
    }

    // --- Avatar ---

    uploadAvatar(file: File): Observable<MessageResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<MessageResponse>(`${this.baseUrl}/me/avatar`, formData);
    }

    removeAvatar(): Observable<MessageResponse> {
        return this.api.delete<MessageResponse>(`${this.baseUrl}/me/avatar`);
    }

    // --- Notifications ---

    getNotifications(page: number = 0, size: number = 20, unreadOnly?: boolean): Observable<PageNotificationResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'createdAt,desc');

        if (unreadOnly !== undefined) {
            params = params.set('unreadOnly', unreadOnly);
        }

        // ApiService might not support HttpParams directly in the simplified get options usually
        // Assuming ApiService signature allows options or we construct url manually.
        // Let's assume standard HttpClient options pattern if ApiService supports it.
        // If ApiService helper doesn't support params object, we'll append query string.

        let url = `${this.baseUrl}/me/notifications?page=${page}&size=${size}&sort=createdAt,desc`;
        if (unreadOnly !== undefined) {
            url += `&unreadOnly=${unreadOnly}`;
        }

        return this.api.get<PageNotificationResponse>(url);
    }

    getUnreadNotificationCount(): Observable<UnreadCountResponse> {
        return this.api.get<UnreadCountResponse>(`${this.baseUrl}/me/notifications/unread/count`);
    }

    markNotificationAsRead(id: number): Observable<MessageResponse> {
        return this.api.put<MessageResponse>(`${this.baseUrl}/me/notifications/${id}/read`, {});
    }

    markAllNotificationsAsRead(): Observable<MessageResponse> {
        return this.api.put<MessageResponse>(`${this.baseUrl}/me/notifications/read-all`, {});
    }

    // --- Activities ---

    getActivities(page: number = 0, size: number = 20): Observable<PageActivityResponse> {
        const url = `${this.baseUrl}/me/activities?page=${page}&size=${size}&sort=createdAt,desc`;
        return this.api.get<PageActivityResponse>(url);
    }

    checkHealth(): Observable<string> {
        return this.api.get<string>(`${this.baseUrl}/health`);
    }
}
