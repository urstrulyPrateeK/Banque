import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountSummaryResponse,
    AllAccountsSummaryResponse,
    AccountStatisticsResponse,
    PageBalanceHistoryResponse,
    AccountTypesResponse,
    MessageResponse,
    PageAccountResponse,
    StatementResponse,
    BalanceResponse,
    DownloadStatementRequest
} from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class AccountApiService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = '/accounts';

    getAllAccounts(page: number = 0, size: number = 20, type?: string, status?: string): Observable<PageAccountResponse> {
        const queryParams: Record<string, string | number> = {
            page,
            size,
            sort: 'createdAt,desc'
        };
        if (type) queryParams['type'] = type;
        if (status) queryParams['status'] = status;

        return this.api.get<PageAccountResponse>(this.baseUrl, queryParams);
    }

    createAccount(data: CreateAccountRequest): Observable<Account> {
        return this.api.post<Account>(this.baseUrl, data);
    }

    getAccount(id: number): Observable<Account> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.get<Account>(`${this.baseUrl}/${id}`);
    }

    updateAccount(id: number, data: UpdateAccountRequest): Observable<Account> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.patch<Account>(`${this.baseUrl}/${id}`, data);
    }

    closeAccount(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.delete<MessageResponse>(`${this.baseUrl}/${id}`);
    }

    setPrimaryAccount(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/primary`, {});
    }

    freezeAccount(id: number, reason: string): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/freeze?reason=${encodeURIComponent(reason)}`, {});
    }

    unfreezeAccount(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/unfreeze`, {});
    }

    getAccountSummary(id: number): Observable<AccountSummaryResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.get<AccountSummaryResponse>(`${this.baseUrl}/${id}/summary`);
    }

    getBalance(id: number): Observable<BalanceResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.get<BalanceResponse>(`${this.baseUrl}/${id}/balance`);
    }

    getBalanceHistory(id: number, startDate: string, endDate: string, page: number = 0, size: number = 20): Observable<PageBalanceHistoryResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        const params = {
            startDate,
            endDate,
            page,
            size,
            sort: 'recordedAt,desc'
        };
        return this.api.get<PageBalanceHistoryResponse>(`${this.baseUrl}/${id}/balance/history`, params);
    }

    getAccountTypes(): Observable<AccountTypesResponse> {
        return this.api.get<AccountTypesResponse>(`${this.baseUrl}/types`);
    }

    getAllAccountsSummary(): Observable<AllAccountsSummaryResponse> {
        return this.api.get<AllAccountsSummaryResponse>(`${this.baseUrl}/summary`);
    }

    getAccountStatistics(): Observable<AccountStatisticsResponse> {
        return this.api.get<AccountStatisticsResponse>(`${this.baseUrl}/statistics`);
    }

    getStatement(id: number, startDate: string, endDate: string): Observable<StatementResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        const params = {
            startDate,
            endDate
        };
        return this.api.get<StatementResponse>(`${this.baseUrl}/${id}/statement`, params);
    }

    downloadStatement(id: number, data: DownloadStatementRequest): Observable<Blob> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid account ID');
        }
        return this.api.postBlob(`${this.baseUrl}/${id}/statement/download`, data);
    }

    checkHealth(): Observable<string> {
        return this.api.get<string>(`${this.baseUrl}/health`);
    }
}
