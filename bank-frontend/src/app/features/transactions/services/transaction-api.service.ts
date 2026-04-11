import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    PageTransactionResponse,
    TransactionResponse,
    TransactionReceiptResponse,
    TransactionStatisticsResponse,
    TransactionCategoriesResponse,
    MessageResponse,
    DepositRequest,
    WithdrawRequest,
    RaiseDisputeRequest,
    SearchTransactionRequest,
    ExportTransactionsRequest,
    Pageable,
} from '@core/models';

export interface GetAllTransactionsParams {
    accountId?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    pageable: Pageable;
}

@Injectable({
    providedIn: 'root',
})
export class TransactionApiService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = '/transactions';

    // GET endpoints
    getAllTransactions(params: GetAllTransactionsParams): Observable<PageTransactionResponse> {
        const queryParams: Record<string, string | number | string[]> = {
            page: params.pageable.page,
            size: params.pageable.size,
        };

        if (params.pageable.sort?.length) {
            queryParams['sort'] = params.pageable.sort;
        }
        if (params.accountId) {
            queryParams['accountId'] = params.accountId;
        }
        if (params.type) {
            queryParams['type'] = params.type;
        }
        if (params.status) {
            queryParams['status'] = params.status;
        }
        if (params.startDate) {
            queryParams['startDate'] = params.startDate;
        }
        if (params.endDate) {
            queryParams['endDate'] = params.endDate;
        }
        if (params.minAmount !== undefined) {
            queryParams['minAmount'] = params.minAmount;
        }
        if (params.maxAmount !== undefined) {
            queryParams['maxAmount'] = params.maxAmount;
        }

        return this.api.get<PageTransactionResponse>(this.baseUrl, queryParams);
    }

    getTransaction(id: number): Observable<TransactionResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid transaction ID');
        }
        return this.api.get<TransactionResponse>(`${this.baseUrl}/${id}`);
    }

    getReceipt(id: number): Observable<TransactionReceiptResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid transaction ID');
        }
        return this.api.get<TransactionReceiptResponse>(`${this.baseUrl}/${id}/receipt`);
    }

    getStatistics(accountId?: number, startDate?: string, endDate?: string): Observable<TransactionStatisticsResponse> {
        const params: Record<string, string | number> = {};
        if (accountId) params['accountId'] = accountId;
        if (startDate) params['startDate'] = startDate;
        if (endDate) params['endDate'] = endDate;

        return this.api.get<TransactionStatisticsResponse>(`${this.baseUrl}/statistics`, params);
    }

    getRecentTransactions(accountId?: number, limit?: number, pageable?: Pageable): Observable<PageTransactionResponse> {
        const params: Record<string, string | number | string[]> = {
            page: pageable?.page ?? 0,
            size: pageable?.size ?? 10,
        };
        if (accountId) params['accountId'] = accountId;
        if (limit) params['limit'] = limit;
        if (pageable?.sort?.length) {
            params['sort'] = pageable.sort;
        }

        return this.api.get<PageTransactionResponse>(`${this.baseUrl}/recent`, params);
    }

    getPendingTransactions(accountId?: number, pageable?: Pageable): Observable<PageTransactionResponse> {
        const params: Record<string, string | number | string[]> = {
            page: pageable?.page ?? 0,
            size: pageable?.size ?? 10,
        };
        if (accountId) params['accountId'] = accountId;
        if (pageable?.sort?.length) {
            params['sort'] = pageable.sort;
        }

        return this.api.get<PageTransactionResponse>(`${this.baseUrl}/pending`, params);
    }

    getCategories(): Observable<TransactionCategoriesResponse> {
        return this.api.get<TransactionCategoriesResponse>(`${this.baseUrl}/categories`);
    }

    // POST endpoints
    deposit(data: DepositRequest): Observable<TransactionResponse> {
        return this.api.post<TransactionResponse>(`${this.baseUrl}/deposit`, data);
    }

    withdraw(data: WithdrawRequest): Observable<TransactionResponse> {
        return this.api.post<TransactionResponse>(`${this.baseUrl}/withdraw`, data);
    }

    searchTransactions(data: SearchTransactionRequest, pageable: Pageable): Observable<PageTransactionResponse> {
        const params = new URLSearchParams();
        params.set('page', pageable.page.toString());
        params.set('size', pageable.size.toString());
        pageable.sort?.forEach((sort) => params.append('sort', sort));

        const url = `${this.baseUrl}/search?${params.toString()}`;
        return this.api.post<PageTransactionResponse>(url, data);
    }

    exportTransactions(data: ExportTransactionsRequest): Observable<Blob> {
        return this.api.postBlob(`${this.baseUrl}/export`, data);
    }

    raiseDispute(id: number, data: RaiseDisputeRequest): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid transaction ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/dispute`, data);
    }

    cancelTransaction(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid transaction ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/cancel`, {});
    }

    // Health check
    checkHealth(): Observable<string> {
        return this.api.get<string>(`${this.baseUrl}/health`);
    }
}
