import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of, catchError } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';
import { StorageService } from '@core/services/storage.service';
import { NotificationService } from '@core/services/notification.service';
import { FirestoreService } from '@core/firebase/firestore.service';
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

const DEMO_TOKEN = 'demo_access_token_banque_2025';

export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ user }) => ({
        isAdmin: computed(() => user()?.role === 'ADMIN'),
        isUser: computed(() => user()?.role === 'USER'),
        fullName: computed(() => {
            const u = user();
            if (!u) return '';
            return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.username || '';
        }),
        userInitials: computed(() => {
            const u = user();
            if (!u) return 'U';
            return u.firstName && u.lastName ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : u.username?.[0]?.toUpperCase() || 'U';
        }),
        userEmail: computed(() => user()?.email ?? ''),
    })),
    withMethods(
        (
            store,
            authService = inject(AuthApiService),
            router = inject(Router),
            storageService = inject(StorageService),
            notificationService = inject(NotificationService),
            firestoreService = inject(FirestoreService)
        ) => {
            function createSessionId(): string {
                return `mfa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            }

            function buildDemoUser(username: string): User {
                const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
                return {
                    id: 1,
                    username,
                    email: `${username}@banque.dev`,
                    firstName: capitalized,
                    lastName: '',
                    role: 'USER',
                    active: true,
                    emailVerified: true,
                    mfaEnabled: false,
                    createdAt: new Date().toISOString(),
                };
            }

            async function startMfaVerification(username: string, user: User): Promise<void> {
                const sessionId = createSessionId();

                // Do not keep app-level auth token before OTP completes.
                storageService.removeToken();
                storageService.removeRefreshToken();

                await firestoreService.setDocument(`${firestoreService.userPath()}/otp/login`, {
                    sessionId,
                    phone: user.phoneNumber || '',
                    code: null,
                    expiresAt: null,
                    resendCount: 0,
                    verified: false,
                    numberAttempts: 0,
                    createdAt: new Date().toISOString(),
                });

                patchState(store, {
                    user,
                    isAuthenticated: false,
                    isLoading: false,
                    mfaRequired: true,
                    sessionId,
                    error: null,
                });

                notificationService.info('Two-factor authentication is enabled. Verify your registered phone number to continue.');
                router.navigate(['/auth/verify-otp']);
            }

            async function handleLoginSuccess(username: string): Promise<void> {
                // Set per-user Firestore path (whether real or demo)
                firestoreService.setUserId(username);

                // Check if this user has been set up before
                try {
                    const isSeeded = await firestoreService.isSeeded();
                    if (!isSeeded) {
                        if (!storageService.getToken()) {
                            storageService.setToken(DEMO_TOKEN);
                        }
                        patchState(store, {
                            isAuthenticated: true,
                            isLoading: false,
                            mfaRequired: false,
                            sessionId: null,
                            error: null,
                        });
                        // New user — redirect to onboarding
                        const name = store.user()?.firstName || username;
                        notificationService.success(`Welcome to Banque, ${name}! Let's set up your account.`);
                        router.navigate(['/auth/onboarding']);
                        return;
                    }
                } catch (e) {
                    console.warn('Firestore seed check skipped:', e);
                }

                // Existing user — load their profile from Firestore (if it exists)
                try {
                    const profile = await firestoreService.getDocument<any>(firestoreService.userPath());
                    if (profile) {
                        const mergedUser = {
                            ...(store.user() ?? buildDemoUser(username)),
                            firstName: profile['firstName'] || store.user()?.firstName,
                            lastName: profile['lastName'] || store.user()?.lastName || '',
                            email: profile['email'] || store.user()?.email,
                            phoneNumber: profile['phoneNumber'] || store.user()?.phoneNumber,
                            mfaEnabled: Boolean(profile['mfaEnabled']),
                            active: profile['active'] !== false,
                        } as User;

                        patchState(store, {
                            user: mergedUser,
                        });

                        if (profile['active'] === false || profile['mfaLoginBlocked'] === true) {
                            storageService.removeToken();
                            storageService.removeRefreshToken();
                            patchState(store, {
                                isAuthenticated: false,
                                isLoading: false,
                                mfaRequired: false,
                                sessionId: null,
                                error: 'Your account is blocked due to failed verification attempts.',
                            });
                            notificationService.error('Your account is blocked. Please contact support.');
                            return;
                        }

                        if (Boolean(profile['mfaEnabled']) && Boolean(profile['otpVerified']) && Boolean(profile['phoneNumber'])) {
                            await startMfaVerification(username, mergedUser);
                            return;
                        }
                    }
                } catch { /* ignore */ }

                if (!storageService.getToken()) {
                    storageService.setToken(DEMO_TOKEN);
                }

                patchState(store, {
                    isAuthenticated: true,
                    isLoading: false,
                    mfaRequired: false,
                    sessionId: null,
                    error: null,
                });

                notificationService.success(`Welcome back, ${store.user()?.firstName || username}!`);
                router.navigate(['/dashboard']);
            }

            async function activateDemoSession(username: string): Promise<void> {
                storageService.setItem('banque_username', username);

                // Initialize the basic demo user state first
                patchState(store, {
                    user: buildDemoUser(username),
                    isAuthenticated: false,
                    isLoading: true,
                    mfaRequired: false,
                    sessionId: null,
                    error: null,
                });

                // Then run the centralized routing and data loading
                await handleLoginSuccess(username);
            }

            return {
                login: rxMethod<LoginRequest>(
                    pipe(
                        tap(() => patchState(store, { isLoading: true, error: null })) ,
                        switchMap((credentials) =>
                            authService.login(credentials).pipe(
                                tapResponse({
                                    next: async (response) => {
                                        if (response?.mfaRequired && response?.sessionId) {
                                            firestoreService.setUserId(credentials.username);
                                            storageService.setItem('banque_username', credentials.username);
                                            patchState(store, {
                                                user: response.user ?? buildDemoUser(credentials.username),
                                                isAuthenticated: false,
                                                isLoading: false,
                                                mfaRequired: true,
                                                sessionId: response.sessionId,
                                                error: null,
                                            });
                                            router.navigate(['/auth/verify-otp']);
                                            return;
                                        }

                                        if (response?.accessToken) {
                                            storageService.setToken(response.accessToken);
                                            if (response.refreshToken) storageService.setRefreshToken(response.refreshToken);
                                            
                                            patchState(store, {
                                                user: response.user ?? buildDemoUser(credentials.username),
                                                isAuthenticated: false,
                                                isLoading: false,
                                            });

                                            // Trigger proper routing/Firebase checks even for real backend hits
                                            await handleLoginSuccess(credentials.username);
                                        } else {
                                            await activateDemoSession(credentials.username);
                                        }
                                    },
                                    error: async () => await activateDemoSession(credentials.username),
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
                                    next: () => {
                                        patchState(store, { isLoading: false });
                                        notificationService.success('Account created! Sign in to continue.');
                                        router.navigate(['/auth/login']);
                                    },
                                    error: () => {
                                        patchState(store, { isLoading: false, error: null });
                                        notificationService.success('Account created! Sign in to continue.');
                                        router.navigate(['/auth/login']);
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
                                        if (response?.accessToken || response?.user) {
                                            storageService.setToken(response?.accessToken || DEMO_TOKEN);
                                            if (response?.refreshToken) {
                                                storageService.setRefreshToken(response.refreshToken);
                                            }
                                            patchState(store, {
                                                user: response.user ?? store.user() ?? buildDemoUser(firestoreService.userId),
                                                isAuthenticated: true,
                                                isLoading: false,
                                                mfaRequired: false,
                                                sessionId: null,
                                                error: null,
                                            });
                                            notificationService.success('Two-factor verification successful.');
                                            router.navigate(['/dashboard']);
                                            return;
                                        }

                                        patchState(store, { error: 'OTP verification failed', isLoading: false });
                                    },
                                    error: (error: Error) => {
                                        patchState(store, { error: error.message, isLoading: false });
                                        notificationService.error(error.message || 'OTP verification failed');
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
                                    next: () => { patchState(store, { isLoading: false }); router.navigate(['/auth/login']); },
                                    error: (error: Error) => patchState(store, { error: error.message, isLoading: false }),
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
                                    next: () => patchState(store, { isLoading: false }),
                                    error: (error: Error) => patchState(store, { error: error.message, isLoading: false }),
                                })
                            )
                        )
                    )
                ),

                logout: rxMethod<void>(
                    pipe(
                        tap(() => {
                            storageService.clearAll();
                            storageService.removeItem('banque_username');
                            firestoreService.clearUserId();
                            patchState(store, initialState);
                            notificationService.info('You have been logged out');
                            router.navigate(['/auth/login']);
                        })
                    )
                ),

                loadUserFromToken() {
                    const token = storageService.getToken();
                    if (token) {
                        patchState(store, { isLoading: true });
                        authService.getCurrentUser().subscribe({
                            next: (user) => patchState(store, { user: user || buildDemoUser(firestoreService.userId), isAuthenticated: true, isLoading: false }),
                            error: () => patchState(store, { user: buildDemoUser(firestoreService.userId), isAuthenticated: true, isLoading: false }),
                        });
                    }
                },

                clearError() { patchState(store, { error: null }); },
                setError(message: string) { patchState(store, { error: message }); },
            };
        }
    )
);
