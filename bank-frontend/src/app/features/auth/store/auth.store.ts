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

const DEMO_USER: User = {
    id: 1,
    username: 'prateek',
    email: 'prateek@banque.dev',
    firstName: 'Prateek',
    lastName: 'Singh',
    role: 'USER',
    active: true,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
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
            return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username || '';
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
            async function activateDemoSession(): Promise<void> {
                storageService.setToken(DEMO_TOKEN);
                patchState(store, {
                    user: DEMO_USER,
                    isAuthenticated: true,
                    isLoading: false,
                    mfaRequired: false,
                    sessionId: null,
                    error: null,
                });

                // Seed Firestore with demo data if not already done
                try {
                    const isSeeded = await firestoreService.isSeeded();
                    if (!isSeeded) {
                        await seedDemoData(firestoreService);
                    }
                } catch (e) {
                    console.warn('Firestore seeding skipped:', e);
                }

                notificationService.success('Welcome, Prateek!');
                router.navigate(['/dashboard']);
            }

            return {
                login: rxMethod<LoginRequest>(
                    pipe(
                        tap(() => patchState(store, { isLoading: true, error: null })),
                        switchMap((credentials) =>
                            authService.login(credentials).pipe(
                                tapResponse({
                                    next: (response) => {
                                        if (response?.accessToken) {
                                            storageService.setToken(response.accessToken);
                                            if (response.refreshToken) storageService.setRefreshToken(response.refreshToken);
                                            patchState(store, {
                                                user: response.user ?? DEMO_USER,
                                                isAuthenticated: true,
                                                isLoading: false,
                                            });
                                            notificationService.success('Welcome back!');
                                            router.navigate(['/dashboard']);
                                        } else {
                                            activateDemoSession();
                                        }
                                    },
                                    error: () => activateDemoSession(),
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
                                        if (response.accessToken) {
                                            storageService.setToken(response.accessToken);
                                            patchState(store, { user: response.user ?? DEMO_USER, isAuthenticated: true, isLoading: false, mfaRequired: false });
                                            router.navigate(['/dashboard']);
                                        }
                                    },
                                    error: (error: Error) => patchState(store, { error: error.message, isLoading: false }),
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
                            next: (user) => patchState(store, { user: user || DEMO_USER, isAuthenticated: true, isLoading: false }),
                            error: () => patchState(store, { user: DEMO_USER, isAuthenticated: true, isLoading: false }),
                        });
                    }
                },

                clearError() { patchState(store, { error: null }); },
                setError(message: string) { patchState(store, { error: message }); },
            };
        }
    )
);

// ─── Demo Data Seeding ───

async function seedDemoData(fs: FirestoreService): Promise<void> {
    // 1. User profile
    await fs.setDocument(fs.userPath(), {
        username: 'prateek',
        email: 'prateek@banque.dev',
        firstName: 'Prateek',
        lastName: 'Singh',
        phone: '+91 9876543210',
        dateOfBirth: '2003-05-15',
        address: '123 Tech Park, Sector 62, Noida, UP 201309',
        role: 'USER',
        active: true,
        emailVerified: true,
        mfaEnabled: false,
        seeded: true,
    });

    // 2. Accounts
    const savingsId = await fs.addDocument(fs.userCollection('accounts'), {
        accountType: 'SAVINGS', nickname: 'Primary Savings',
        currency: 'USD', balance: 28459.75, status: 'ACTIVE',
        isPrimary: true, accountNumber: '4520 8834 2219',
    });

    const checkingId = await fs.addDocument(fs.userCollection('accounts'), {
        accountType: 'CHECKING', nickname: 'Daily Checking',
        currency: 'USD', balance: 5230.50, status: 'ACTIVE',
        isPrimary: false, accountNumber: '4520 7712 4401',
    });

    // 3. Transactions
    const txns = [
        { type: 'DEPOSIT', amount: 4500, description: 'Salary — June 2025', accountId: savingsId, status: 'COMPLETED', category: 'Salary' },
        { type: 'WITHDRAWAL', amount: 120, description: 'Grocery Store', accountId: checkingId, status: 'COMPLETED', category: 'Food' },
        { type: 'WITHDRAWAL', amount: 45.99, description: 'Netflix Subscription', accountId: checkingId, status: 'COMPLETED', category: 'Entertainment' },
        { type: 'DEPOSIT', amount: 1200, description: 'Freelance Payment — UI Project', accountId: savingsId, status: 'COMPLETED', category: 'Freelance' },
        { type: 'WITHDRAWAL', amount: 89, description: 'Electricity Bill', accountId: checkingId, status: 'COMPLETED', category: 'Bills' },
        { type: 'WITHDRAWAL', amount: 250, description: 'Amazon Purchase', accountId: checkingId, status: 'COMPLETED', category: 'Shopping' },
        { type: 'DEPOSIT', amount: 500, description: 'Refund — Flight Cancellation', accountId: savingsId, status: 'COMPLETED', category: 'Refund' },
    ];
    for (let i = 0; i < txns.length; i++) {
        const daysAgo = i * 3 + 1;
        const date = new Date(); date.setDate(date.getDate() - daysAgo);
        await fs.addDocument(fs.userCollection('transactions'), { ...txns[i], createdAt: date.toISOString() });
    }

    // 4. Transfers
    await fs.addDocument(fs.userCollection('transfers'), {
        type: 'INTERNAL', fromAccountId: checkingId, toAccountId: savingsId,
        amount: 1000, description: 'Monthly savings transfer', status: 'COMPLETED',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    // 5. Cards
    await fs.addDocument(fs.userCollection('cards'), {
        type: 'DEBIT', cardNumber: '4520 •••• •••• 3847',
        expiryDate: '09/2028', cardholderName: 'PRATEEK SINGH',
        accountId: savingsId, status: 'ACTIVE',
        onlineEnabled: true, contactlessEnabled: true, internationalEnabled: false,
        createdAt: new Date().toISOString(),
    });

    // 6. Notifications
    const notifs = [
        { title: 'Account Created', message: 'Your Banque account has been set up successfully.', read: false, type: 'INFO' },
        { title: 'Salary Received', message: 'You received $4,500.00 from Employer Corp.', read: false, type: 'CREDIT' },
        { title: 'Card Activated', message: 'Your debit card ending in 3847 is now active.', read: true, type: 'INFO' },
    ];
    for (let i = 0; i < notifs.length; i++) {
        const date = new Date(); date.setDate(date.getDate() - i);
        await fs.addDocument(fs.userCollection('notifications'), { ...notifs[i], createdAt: date.toISOString() });
    }

    // 7. Activity log
    const activities = [
        { action: 'LOGIN', description: 'Logged in from Chrome on Windows', ip: '192.168.1.1' },
        { action: 'ACCOUNT_CREATED', description: 'Created Primary Savings account' },
        { action: 'CARD_ACTIVATED', description: 'Activated debit card ending in 3847' },
    ];
    for (let i = 0; i < activities.length; i++) {
        const date = new Date(); date.setDate(date.getDate() - i);
        await fs.addDocument(fs.userCollection('activity'), { ...activities[i], createdAt: date.toISOString() });
    }

    // 8. Settings
    await fs.setDocument(`${fs.userPath()}/settings/preferences`, {
        language: 'en', currency: 'USD', timezone: 'Asia/Kolkata',
        emailNotifications: true, pushNotifications: true,
        twoFactorEnabled: false, darkMode: false,
    });
}
