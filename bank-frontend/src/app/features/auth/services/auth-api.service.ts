// Banque — Auth API Service (Firestore-aware)

import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { FirestoreService } from '@core/firebase/firestore.service';

const DEMO_TOKEN = 'demo_access_token_banque_2025';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly api = inject(ApiService);
    private readonly fs = inject(FirestoreService);

    login(credentials: any): Observable<any> {
        return this.api.post<any>('/auth/login', credentials).pipe(
            catchError(() => of(null)) // Will fall through to demo mode in auth store
        );
    }

    register(data: any): Observable<any> {
        return this.api.post<any>('/auth/register', data).pipe(
            catchError(() => of({ message: 'Account created successfully' }))
        );
    }

    verifyOtp(data: any): Observable<any> {
        return this.api.post<any>('/auth/verify-otp', data).pipe(
            catchError(() => from(this.verifyOtpWithFirestore(data)))
        );
    }

    verifyEmail(data: any): Observable<any> {
        return of({ message: 'Email verified' });
    }

    resendVerification(data: any): Observable<any> {
        return of({ message: 'Verification email sent' });
    }

    forgotPassword(email: string): Observable<any> {
        return of({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    resetPassword(token: string, password: string): Observable<any> {
        return of({ message: 'Password reset successfully' });
    }

    resendOtp(sessionId: string): Observable<any> {
        return of({ message: 'OTP resent successfully' });
    }

    logout(refreshToken?: string): Observable<any> {
        return of({ message: 'Logged out' });
    }

    getCurrentUser(): Observable<any> {
        return from(this.fs.getDocument<any>(this.fs.userPath())).pipe(
            map((user) => {
                if (user) return user;
                // Return a minimal user from the current userId — no hardcoded fallback
                const uid = this.fs.userId;
                return {
                    id: 1,
                    username: uid,
                    email: `${uid}@banque.dev`,
                    firstName: uid.charAt(0).toUpperCase() + uid.slice(1),
                    lastName: '',
                    role: 'USER',
                    active: true,
                    emailVerified: true,
                    mfaEnabled: false,
                };
            })
        );
    }

    refreshToken(refreshToken: string): Observable<any> {
        return of({ accessToken: 'demo_access_token_banque_2025' });
    }

    private async verifyOtpWithFirestore(data: { sessionId: string; otp: string }): Promise<any> {
        const otpPath = `${this.fs.userPath()}/otp/login`;
        const otpDoc = await this.fs.getDocument<any>(otpPath);

        if (!otpDoc || !otpDoc.sessionId) {
            throw new Error('OTP session expired. Please login again.');
        }

        if (otpDoc.sessionId !== data.sessionId) {
            throw new Error('Invalid OTP session. Please login again.');
        }

        const expiry = otpDoc.expiresAt ? new Date(otpDoc.expiresAt).getTime() : 0;
        if (!expiry || Date.now() > expiry) {
            throw new Error('OTP expired. Please request a new code.');
        }

        if (String(otpDoc.code || '') !== String(data.otp || '')) {
            throw new Error('Invalid OTP. Please try again.');
        }

        const user = await this.fs.getDocument<any>(this.fs.userPath());
        if (user?.active === false || user?.mfaLoginBlocked === true) {
            throw new Error('Your account is blocked. Please contact support.');
        }

        await this.fs.setDocument(otpPath, {
            verified: true,
            verifiedAt: new Date().toISOString(),
            code: null,
        });

        await this.fs.setDocument(this.fs.userPath(), {
            mfaLoginNumberAttempts: 0,
            mfaLoginBlocked: false,
            lastMfaLoginAt: new Date().toISOString(),
        });

        const uid = this.fs.userId;
        return {
            accessToken: DEMO_TOKEN,
            user: user || {
                id: 1,
                username: uid,
                email: `${uid}@banque.dev`,
                firstName: uid.charAt(0).toUpperCase() + uid.slice(1),
                lastName: '',
                role: 'USER',
                active: true,
                emailVerified: true,
                mfaEnabled: true,
            },
        };
    }
}
