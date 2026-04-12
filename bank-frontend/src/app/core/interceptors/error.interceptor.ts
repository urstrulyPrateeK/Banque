import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, throwError } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';

const DEMO_TOKEN = 'demo_access_token_banque_2025';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const notificationService = inject(NotificationService);
    const storageService = inject(StorageService);

    const isDemoMode = storageService.getToken() === DEMO_TOKEN;

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // In demo mode, silently return empty responses for API calls
            // instead of showing error notifications that break the UX
            if (isDemoMode && (error.status === 0 || error.status >= 500)) {
                // Return an empty successful response so components can handle empty data gracefully
                return of(new HttpResponse({ status: 200, body: emptyResponseForUrl(req.url) }));
            }

            let errorMessage = 'An unexpected error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                switch (error.status) {
                    case 0:
                        // Backend unreachable — don't clear session, just inform
                        errorMessage = 'Server is unreachable. Please check your connection.';
                        break;
                    case 401:
                        errorMessage = 'Session expired. Please login again.';
                        storageService.clearAll();
                        router.navigate(['/auth/login']);
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to perform this action.';
                        break;
                    case 404:
                        errorMessage = 'The requested resource was not found.';
                        break;
                    case 422:
                        errorMessage = error.error?.message || 'Validation error occurred.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    default:
                        errorMessage = error.error?.message || errorMessage;
                }
            }

            notificationService.error(errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};

/**
 * Returns a sensible empty body for demo-mode API responses
 * so Angular components render "empty state" instead of crashing.
 */
function emptyResponseForUrl(url: string): unknown {
    // Account endpoints
    if (url.includes('/accounts/summary') || url.includes('/accounts/all'))
        return { accounts: [], totalAccounts: 0, totalBalance: 0, activeAccounts: 0 };
    if (url.includes('/accounts/statistics'))
        return { totalAccounts: 0, activeAccounts: 0, frozenAccounts: 0, totalBalance: 0 };
    if (url.includes('/accounts'))
        return { content: [], totalElements: 0, totalPages: 0 };

    // Transaction endpoints
    if (url.includes('/transactions/statistics'))
        return { totalDeposits: 0, totalWithdrawals: 0, depositCount: 0, withdrawalCount: 0 };
    if (url.includes('/transactions'))
        return { content: [], totalElements: 0, totalPages: 0 };

    // Transfer endpoints
    if (url.includes('/transfers'))
        return { content: [], totalElements: 0, totalPages: 0 };

    // Payment endpoints
    if (url.includes('/payments'))
        return { content: [], totalElements: 0, totalPages: 0 };

    // Card endpoints
    if (url.includes('/cards'))
        return [];

    // User / profile endpoints
    if (url.includes('/users') || url.includes('/profile'))
        return null;

    // Feedback
    if (url.includes('/feedback'))
        return { success: true };

    // Documents
    if (url.includes('/documents'))
        return [];

    // Activity
    if (url.includes('/activity'))
        return { content: [], totalElements: 0, totalPages: 0 };

    return {};
}
