import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '@core/services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const storageService = inject(StorageService);
    const token = storageService.getToken();

    if (token) {
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
        return next(clonedReq);
    }

    return next(req);
};
