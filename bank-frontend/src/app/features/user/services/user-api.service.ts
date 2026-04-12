// Banque — User API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
import {
    UserResponse,
    UpdateProfileRequest,
    PartialUpdateRequest,
    MessageResponse,
    UserSettingsResponse,
    UpdateSettingsRequest,
    ChangePasswordRequest,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
    private readonly fs = inject(FirestoreService);

    // --- Profile ---

    getCurrentUser(): Observable<UserResponse> {
        return from(this.fs.getDocument<UserResponse>(this.fs.userPath())).pipe(
            map((user) => user || this.defaultUser())
        );
    }

    updateProfile(data: UpdateProfileRequest): Observable<UserResponse> {
        return from(this.fs.setDocument(this.fs.userPath(), data as unknown as Record<string, unknown>)).pipe(
            map(() => ({ ...this.defaultUser(), ...data } as unknown as UserResponse))
        );
    }

    partialUpdateProfile(data: PartialUpdateRequest): Observable<UserResponse> {
        return from(this.fs.setDocument(this.fs.userPath(), data as unknown as Record<string, unknown>)).pipe(
            map(() => ({ ...this.defaultUser(), ...data } as unknown as UserResponse))
        );
    }

    deleteAccount(): Observable<MessageResponse> {
        return from(this.fs.deleteDocument(this.fs.userPath())).pipe(
            map(() => ({ message: 'Account deleted' }))
        );
    }

    // --- Settings ---

    getSettings(): Observable<UserSettingsResponse> {
        return from(this.fs.getDocument<UserSettingsResponse>(`${this.fs.userPath()}/settings/preferences`)).pipe(
            map((settings) => settings || this.defaultSettings())
        );
    }

    updateSettings(data: UpdateSettingsRequest): Observable<UserSettingsResponse> {
        return from(this.fs.setDocument(`${this.fs.userPath()}/settings/preferences`, data as unknown as Record<string, unknown>)).pipe(
            map(() => ({ ...this.defaultSettings(), ...data } as unknown as UserSettingsResponse))
        );
    }

    changePassword(data: ChangePasswordRequest): Observable<MessageResponse> {
        return of({ message: 'Password changed successfully' });
    }

    // --- MFA ---
    enableMfa(): Observable<any> { return of({ secret: 'DEMO-MFA-SECRET', qrCodeUrl: '' }); }
    verifyMfaSetup(): Observable<MessageResponse> { return of({ message: 'MFA enabled' }); }
    disableMfa(): Observable<MessageResponse> { return of({ message: 'MFA disabled' }); }

    // --- Avatar ---

    uploadAvatar(file: File): Observable<MessageResponse> {
        return from(this.fs.fileToBase64(file)).pipe(
            switchMap((base64Url) =>
                from(this.fs.setDocument(this.fs.userPath(), { avatarUrl: base64Url })).pipe(
                    map(() => ({ message: 'Avatar uploaded successfully' }))
                )
            )
        );
    }

    removeAvatar(): Observable<MessageResponse> {
        return from(this.fs.setDocument(this.fs.userPath(), { avatarUrl: null })).pipe(
            map(() => ({ message: 'Avatar removed' }))
        );
    }

    // --- Notifications ---

    getNotifications(page: number = 0, size: number = 20, unreadOnly?: boolean): Observable<any> {
        return from(this.fs.getCollection<any>(this.fs.userCollection('notifications'))).pipe(
            map((notifs) => {
                notifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                return {
                    content: notifs.slice(page * size, (page + 1) * size),
                    totalElements: notifs.length,
                    totalPages: Math.ceil(notifs.length / size),
                };
            })
        );
    }

    getUnreadNotificationCount(): Observable<any> {
        return from(this.fs.getCollection<any>(this.fs.userCollection('notifications'))).pipe(
            map((notifs) => ({ count: notifs.filter((n: any) => !n.read).length }))
        );
    }

    markNotificationAsRead(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.fs.userCollection('notifications')}/${id}`, { read: true })).pipe(
            map(() => ({ message: 'Notification marked as read' }))
        );
    }

    markAllNotificationsAsRead(): Observable<MessageResponse> {
        return from(this.markAllReadHelper()).pipe(map(() => ({ message: 'All notifications read' })));
    }

    private async markAllReadHelper(): Promise<void> {
        const notifs = await this.fs.getCollection<any>(this.fs.userCollection('notifications'));
        for (const n of notifs) {
            if (n.id && !n.read) {
                await this.fs.updateDocument(`${this.fs.userCollection('notifications')}/${n.id}`, { read: true });
            }
        }
    }

    // --- Activities ---

    getActivities(page: number = 0, size: number = 20): Observable<any> {
        return from(this.fs.getCollection<any>(this.fs.userCollection('activity'))).pipe(
            map((activities) => {
                activities.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                return {
                    content: activities.slice(page * size, (page + 1) * size),
                    totalElements: activities.length,
                    totalPages: Math.ceil(activities.length / size),
                };
            })
        );
    }

    checkHealth(): Observable<string> { return of('OK'); }

    private defaultUser(): UserResponse {
        return {
            id: 1,
            username: 'prateek',
            email: 'prateek@banque.dev',
            firstName: 'Prateek',
            lastName: 'Singh',
            role: 'USER',
            active: true,
            emailVerified: true,
            mfaEnabled: false,
        } as UserResponse;
    }

    private defaultSettings(): UserSettingsResponse {
        return {
            id: 1,
            userId: 1,
            language: 'en',
            currency: 'USD',
            timeZone: 'Asia/Kolkata',
            theme: 'light',
            profileVisibility: 'public',
            emailNotifications: true,
            smsNotifications: true,
            pushNotifications: true,
            transactionNotifications: true,
            securityNotifications: true,
            marketingNotifications: false,
            showEmail: true,
            showPhone: false,
            mfaEnabled: false,
        } as UserSettingsResponse;
    }
}
