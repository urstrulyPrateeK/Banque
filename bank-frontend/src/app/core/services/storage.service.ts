import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private readonly tokenKey = environment.tokenKey;
    private readonly refreshTokenKey = environment.refreshTokenKey;

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken(): void {
        localStorage.removeItem(this.tokenKey);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem(this.refreshTokenKey, token);
    }

    removeRefreshToken(): void {
        localStorage.removeItem(this.refreshTokenKey);
    }

    clearAll(): void {
        this.removeToken();
        this.removeRefreshToken();
    }

    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }

    getItem(key: string): string | null {
        return localStorage.getItem(key);
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
}
