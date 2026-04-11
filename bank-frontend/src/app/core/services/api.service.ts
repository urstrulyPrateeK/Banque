import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    private buildParams(params?: Record<string, unknown>): HttpParams {
        let httpParams = new HttpParams();
        if (!params) {
            return httpParams;
        }

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }

            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    if (entry !== null && entry !== undefined) {
                        httpParams = httpParams.append(key, String(entry));
                    }
                });
                return;
            }

            httpParams = httpParams.append(key, String(value));
        });

        return httpParams;
    }

    get<T>(endpoint: string, params?: Record<string, unknown>): Observable<T> {
        const httpParams = this.buildParams(params);
        return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
            params: httpParams,
        });
    }

    post<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
    }

    put<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
    }

    patch<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body);
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
    }

    getBlob(endpoint: string, params?: Record<string, unknown>): Observable<Blob> {
        const httpParams = this.buildParams(params);
        return this.http.get(`${this.baseUrl}${endpoint}`, {
            params: httpParams,
            responseType: 'blob',
        });
    }

    postBlob(endpoint: string, body: unknown): Observable<Blob> {
        return this.http.post(`${this.baseUrl}${endpoint}`, body, {
            responseType: 'blob',
        });
    }
}
