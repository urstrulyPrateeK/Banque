import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { UserApiService } from '../services/user-api.service';
import { NotificationService } from '@core/services/notification.service';
import {
    UserResponse,
    UserSettingsResponse,
    Notification,
    Activity,
    UpdateProfileRequest,
    UpdateSettingsRequest,
    PartialUpdateRequest,
    ChangePasswordRequest,
    VerifyMfaRequest,
    DisableMfaRequest,
} from '@core/models';

interface UserState {
    profile: UserResponse | null;
    settings: UserSettingsResponse | null;
    notifications: Notification[];
    unreadNotificationCount: number;
    activities: Activity[];
    isLoading: boolean;
    error: string | null;
    avatarUrl: string | null;
}

const initialState: UserState = {
    profile: null,
    settings: null,
    notifications: [],
    unreadNotificationCount: 0,
    activities: [],
    isLoading: false,
    error: null,
    avatarUrl: null,
};

export const UserStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ profile, notifications }) => ({
        fullName: computed(() => {
            const user = profile();
            if (!user) return '';
            return `${user.firstName} ${user.lastName}`;
        }),
        userInitials: computed(() => {
            const user = profile();
            if (!user) return 'U';
            if (user.firstName && user.lastName) {
                return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
            }
            return user.username?.[0]?.toUpperCase() || 'U';
        }),
        hasUnreadNotifications: computed(() => notifications().some(n => !n.read)),
    })),
    withMethods(
        (
            store,
            userApi = inject(UserApiService),
            notificationService = inject(NotificationService)
        ) => ({
            // --- Profile ---
            loadProfile: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() =>
                        userApi.getCurrentUser().pipe(
                            tapResponse({
                                next: (profile) => patchState(store, {
                                    profile,
                                    avatarUrl: profile.avatarUrl || null,
                                    isLoading: false
                                }),
                                error: (error: any) => patchState(store, { error: error.message, isLoading: false }),
                            })
                        )
                    )
                )
            ),

            updateProfile: rxMethod<UpdateProfileRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((data) =>
                        userApi.updateProfile(data).pipe(
                            tapResponse({
                                next: (profile) => {
                                    patchState(store, { profile, isLoading: false });
                                    notificationService.success('Profile updated successfully');
                                },
                                error: (error: any) => {
                                    console.error('Update profile error:', error);
                                    patchState(store, { error: error.message, isLoading: false });
                                    notificationService.error('Failed to update profile');
                                },
                            })
                        )
                    )
                )
            ),

            partialUpdate: rxMethod<PartialUpdateRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((data) =>
                        userApi.partialUpdateProfile(data).pipe(
                            tapResponse({
                                next: (profile) => {
                                    patchState(store, { profile, isLoading: false });
                                    notificationService.success('Profile updated');
                                },
                                error: (error: any) => {
                                    patchState(store, { error: error.message, isLoading: false });
                                },
                            })
                        )
                    )
                )
            ),

            uploadAvatar: rxMethod<File>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((file) =>
                        userApi.uploadAvatar(file).pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, { isLoading: false });
                                    // Manually triggering loadProfile would be ideal, but we can't easily call other methods from here directly inside rxMethod definition without context or structural change.
                                    // A better pattern is to just invalidate or manually call the API and patch.
                                    // But since we are inside the store factory, we *can* call the method if we structure it right, or just re-fetch.

                                    // Simplest fix: Re-fetch profile and update state
                                    userApi.getCurrentUser().subscribe({
                                        next: (profile) => patchState(store, { profile }),
                                        error: (err) => console.error('Failed to reload profile after upload', err)
                                    });
                                    notificationService.success('Avatar uploaded');
                                },
                                error: (err: any) => patchState(store, { error: err.message, isLoading: false }),
                            })
                        )
                    )
                )
            ),

            // --- Settings ---
            loadSettings: rxMethod<void>(
                pipe(
                    switchMap(() =>
                        userApi.getSettings().pipe(
                            tapResponse({
                                next: (settings) => patchState(store, { settings }),
                                error: (error: any) => console.error('Failed to load settings', error),
                            })
                        )
                    )
                )
            ),

            updateSettings: rxMethod<UpdateSettingsRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((data) =>
                        userApi.updateSettings(data).pipe(
                            tapResponse({
                                next: (settings) => {
                                    patchState(store, { settings, isLoading: false });
                                    notificationService.success('Settings saved');
                                },
                                error: (error: any) => {
                                    patchState(store, { error: error.message, isLoading: false });
                                    notificationService.error('Failed to save settings');
                                },
                            })
                        )
                    )
                )
            ),

            changePassword: rxMethod<ChangePasswordRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((data) =>
                        userApi.changePassword(data).pipe(
                            tapResponse({
                                next: (res) => {
                                    patchState(store, { isLoading: false });
                                    notificationService.success(res.message || 'Password changed successfully');
                                },
                                error: (error: any) => {
                                    patchState(store, { error: error.message, isLoading: false });
                                    notificationService.error(error.message || 'Failed to change password');
                                },
                            })
                        )
                    )
                )
            ),

            // --- Notifications ---
            loadNotifications: rxMethod<{ page?: number, unreadOnly?: boolean }>(
                pipe(
                    switchMap(({ page = 0, unreadOnly }) =>
                        userApi.getNotifications(page, 20, unreadOnly).pipe(
                            tapResponse({
                                next: (res) => patchState(store, { notifications: res.content }),
                                error: (err) => console.error(err)
                            })
                        )
                    )
                )
            ),

            loadUnreadCount: rxMethod<void>(
                pipe(
                    switchMap(() =>
                        userApi.getUnreadNotificationCount().pipe(
                            tapResponse({
                                next: (res) => patchState(store, { unreadNotificationCount: res.count }),
                                error: () => { }
                            })
                        )
                    )
                )
            ),

            markAsRead: rxMethod<number>(
                pipe(
                    switchMap((id) =>
                        userApi.markNotificationAsRead(id).pipe(
                            tapResponse({
                                next: () => {
                                    // Optimistic update
                                    patchState(store, (state) => ({
                                        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
                                        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
                                    }));
                                },
                                error: () => notificationService.error('Failed to mark as read')
                            })
                        )
                    )
                )
            ),

            markAllAsRead: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() =>
                        userApi.markAllNotificationsAsRead().pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, (state) => ({
                                        notifications: state.notifications.map(n => ({ ...n, read: true })),
                                        unreadNotificationCount: 0,
                                        isLoading: false
                                    }));
                                    notificationService.success('All notifications marked as read');
                                },
                                error: (err: any) => patchState(store, { error: err.message, isLoading: false })
                            })
                        )
                    )
                )
            ),

            // --- Activities ---
            loadActivities: rxMethod<{ page?: number }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(({ page = 0 }) =>
                        userApi.getActivities(page, 20).pipe(
                            tapResponse({
                                next: (res) => patchState(store, { activities: res.content, isLoading: false }),
                                error: (err: any) => patchState(store, { error: err.message, isLoading: false })
                            })
                        )
                    )
                )
            ),
        })
    )
);
