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
import { Router } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';
import { StorageService } from '@core/services/storage.service';
import { NotificationService } from '@core/services/notification.service';
import {
    User,
    LoginRequest,
    RegisterRequest,
    OtpVerifyRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
} from '@core/models';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    mfaRequired: boolean;
    sessionId: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    mfaRequired: false,
    sessionId: null,
};

export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ user }) => ({
        isAdmin: computed(() => user()?.role === 'ADMIN'),
        isUser: computed(() => user()?.role === 'USER'),
        fullName: computed(() => {
            const currentUser = user();
            if (!currentUser) return '';
            if (currentUser.firstName && currentUser.lastName) {
                return `${currentUser.firstName} ${currentUser.lastName}`;
            }
            return currentUser.username || '';
        }),
        userInitials: computed(() => {
            const currentUser = user();
            if (!currentUser) return 'U';
            if (currentUser.firstName && currentUser.lastName) {
                return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
            }
            return currentUser.username?.[0]?.toUpperCase() || 'U';
        }),
        userEmail: computed(() => user()?.email ?? ''),
    })),
    withMethods(
        (
            store,
            authService = inject(AuthApiService),
            router = inject(Router),
            storageService = inject(StorageService),
            notificationService = inject(NotificationService)
        ) => ({
            login: rxMethod<LoginRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((credentials) =>
                        authService.login(credentials).pipe(
                            tapResponse({
                                next: (response) => {
                                    console.log('Login response:', response);
                                    if (response.sessionId) {
                                        console.log('Session ID present, navigating to OTP');
                                        patchState(store, {
                                            mfaRequired: true,
                                            sessionId: response.sessionId,
                                            isLoading: false,
                                        });
                                        notificationService.info('OTP sent! Check your device.');
                                        router.navigate(['/auth/verify-otp']);
                                    } else if (response.accessToken) {
                                        storageService.setToken(response.accessToken);
                                        if (response.refreshToken) {
                                            storageService.setRefreshToken(response.refreshToken);
                                        }
                                        patchState(store, {
                                            user: response.user ?? null,
                                            isAuthenticated: true,
                                            isLoading: false,
                                            mfaRequired: false,
                                            sessionId: null,
                                        });
                                        notificationService.success('Welcome back!');
                                        router.navigate(['/dashboard']);
                                    }
                                },
                                error: (error: Error) => {
                                    patchState(store, {
                                        error: error.message || 'Login failed',
                                        isLoading: false,
                                    });
                                },
                            })
                        )
                    )
                )
            ),

            register: rxMethod<RegisterRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((userData) =>
                        authService.register(userData).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, { isLoading: false });
                                    notificationService.success(response.message || 'Account created successfully!');
                                    router.navigate(['/auth/login']);
                                },
                                error: (error: Error) => {
                                    patchState(store, {
                                        error: error.message || 'Registration failed',
                                        isLoading: false,
                                    });
                                },
                            })
                        )
                    )
                )
            ),

            verifyOtp: rxMethod<OtpVerifyRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((data) =>
                        authService.verifyOtp(data).pipe(
                            tapResponse({
                                next: (response) => {
                                    if (response.accessToken) {
                                        storageService.setToken(response.accessToken);
                                        if (response.refreshToken) {
                                            storageService.setRefreshToken(response.refreshToken);
                                        }
                                        patchState(store, {
                                            user: response.user ?? null,
                                            isAuthenticated: true,
                                            isLoading: false,
                                            mfaRequired: false,
                                            sessionId: null,
                                        });
                                        notificationService.success('Verification successful!');
                                        router.navigate(['/dashboard']);
                                    }
                                },
                                error: (error: Error) => {
                                    patchState(store, {
                                        error: error.message || 'OTP verification failed',
                                        isLoading: false,
                                    });
                                },
                            })
                        )
                    )
                )
            ),

            verifyEmail: rxMethod<VerifyEmailRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((data) =>
                        authService.verifyEmail(data).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, { isLoading: false });
                                    notificationService.success(response.message || 'Email verified successfully!');
                                    router.navigate(['/auth/login']);
                                },
                                error: (error: Error) => {
                                    patchState(store, {
                                        error: error.message || 'Email verification failed',
                                        isLoading: false,
                                    });
                                },
                            })
                        )
                    )
                )
            ),

            resendVerification: rxMethod<ResendVerificationRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((data) =>
                        authService.resendVerification(data).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, { isLoading: false });
                                    notificationService.success(response.message || 'Verification email resent!');
                                },
                                error: (error: Error) => {
                                    patchState(store, {
                                        error: error.message || 'Failed to resend verification email',
                                        isLoading: false,
                                    });
                                },
                            })
                        )
                    )
                )
            ),

            logout: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() => {
                        const refreshToken = storageService.getRefreshToken() || undefined;
                        return authService.logout(refreshToken).pipe(
                            tapResponse({
                                next: () => {
                                    storageService.clearAll();
                                    patchState(store, initialState);
                                    notificationService.info('You have been logged out');
                                    router.navigate(['/auth/login']);
                                },
                                error: () => {
                                    // Even if logout fails on server, clear local state
                                    storageService.clearAll();
                                    patchState(store, initialState);
                                    notificationService.info('You have been logged out locally');
                                    router.navigate(['/auth/login']);
                                },
                            })
                        );
                    })
                )
            ),

            loadUserFromToken() {
                const token = storageService.getToken();
                if (token) {
                    patchState(store, { isLoading: true });
                    authService.getCurrentUser().subscribe({
                        next: (user) => {
                            patchState(store, {
                                user,
                                isAuthenticated: true,
                                isLoading: false,
                            });
                        },
                        error: () => {
                            storageService.clearAll();
                            patchState(store, { ...initialState });
                        },
                    });
                }
            },

            clearError() {
                patchState(store, { error: null });
            },

            setError(message: string) {
                patchState(store, { error: message });
            },
        })
    )
);
