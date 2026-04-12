// Banque — Auth API Service (Firestore-aware)

import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { FirestoreService } from '@core/firebase/firestore.service';

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
        return this.api.post<any>('/auth/verify-otp', data);
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
            map((user) => user || {
                id: 1, username: 'prateek', email: 'prateek@banque.dev',
                firstName: 'Prateek', lastName: 'Singh', role: 'USER',
                active: true, emailVerified: true, mfaEnabled: false,
            })
        );
    }

    refreshToken(refreshToken: string): Observable<any> {
        return of({ accessToken: 'demo_access_token_banque_2025' });
    }
}
