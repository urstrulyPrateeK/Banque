import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const notificationService = inject(NotificationService);
    const storageService = inject(StorageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                switch (error.status) {
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
