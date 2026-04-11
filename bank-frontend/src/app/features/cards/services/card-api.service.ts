import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    ActivateCardRequest,
    CardDetailsResponse,
    CardLimitsResponse,
    CardRequestRequest,
    CardResponse,
    CardStatementResponse,
    CardStatisticsResponse,
    CardTransactionResponse,
    CardTypesResponse,
    ChangePinRequest,
    MessageResponse,
    PageCardResponse,
    PageCardTransactionResponse,
    Pageable,
    SetCardLimitsRequest,
} from '@core/models';

export interface GetAllCardsParams {
    accountId?: number;
    type?: string;
    status?: string;
    pageable: Pageable;
}

export interface GetCardTransactionsParams {
    id: number;
    pageable: Pageable;
    startDate?: string;
    endDate?: string;
}

@Injectable({
    providedIn: 'root',
})
export class CardApiService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = '/cards';

    // GET endpoints
    getAllCards(params: GetAllCardsParams): Observable<PageCardResponse> {
        const queryParams: Record<string, string | number | string[]> = {
            page: params.pageable.page,
            size: params.pageable.size,
            sort: params.pageable.sort?.length ? params.pageable.sort : ['createdAt,desc'],
        };

        if (params.accountId) {
            queryParams['accountId'] = params.accountId;
        }
        if (params.type) {
            queryParams['type'] = params.type;
        }
        if (params.status) {
            queryParams['status'] = params.status;
        }

        return this.api.get<PageCardResponse>(this.baseUrl, queryParams);
    }

    getCard(id: number): Observable<CardResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.get<CardResponse>(`${this.baseUrl}/${id}`);
    }

    getCardDetails(id: number): Observable<CardDetailsResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.get<CardDetailsResponse>(`${this.baseUrl}/${id}/details`);
    }

    getCardLimits(id: number): Observable<CardLimitsResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.get<CardLimitsResponse>(`${this.baseUrl}/${id}/limits`);
    }

    getCardStatement(id: number, startDate: string, endDate: string): Observable<CardStatementResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }
        const params: Record<string, string> = { startDate, endDate };
        return this.api.get<CardStatementResponse>(`${this.baseUrl}/${id}/statement`, params);
    }

    getCardTransactions(params: GetCardTransactionsParams): Observable<PageCardTransactionResponse> {
        if (!params.id || Number.isNaN(params.id) || params.id <= 0) {
            throw new Error('Invalid card ID');
        }
        const queryParams: Record<string, string | number | string[]> = {
            page: params.pageable.page,
            size: params.pageable.size,
            sort: params.pageable.sort?.length ? params.pageable.sort : ['createdAt,desc'],
        };
        if (params.startDate) {
            queryParams['startDate'] = params.startDate;
        }
        if (params.endDate) {
            queryParams['endDate'] = params.endDate;
        }

        return this.api.get<PageCardTransactionResponse>(`${this.baseUrl}/${params.id}/transactions`, queryParams);
    }

    getCardTypes(): Observable<CardTypesResponse> {
        return this.api.get<CardTypesResponse>(`${this.baseUrl}/types`);
    }

    getStatistics(startDate?: string, endDate?: string): Observable<CardStatisticsResponse> {
        const params: Record<string, string> = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate) params['endDate'] = endDate;
        return this.api.get<CardStatisticsResponse>(`${this.baseUrl}/statistics`, params);
    }

    // POST/PUT/DELETE endpoints
    requestCard(data: CardRequestRequest): Observable<CardResponse> {
        return this.api.post<CardResponse>(`${this.baseUrl}/request`, data);
    }

    activateCard(id: number, data: ActivateCardRequest): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/activate`, data);
    }

    changePin(id: number, data: ChangePinRequest): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/change-pin`, data);
    }

    blockCard(id: number, reason: string): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/block?reason=${encodeURIComponent(reason)}`, {});
    }

    unblockCard(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/unblock`, {});
    }

    reportLost(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/report-lost`, {});
    }

    replaceCard(id: number, reason: string): Observable<CardResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.post<CardResponse>(`${this.baseUrl}/${id}/replace?reason=${encodeURIComponent(reason)}`, {});
    }

    toggleOnlineTransactions(id: number, enabled: boolean): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/online-transactions?enabled=${enabled}`, {});
    }

    toggleContactless(id: number, enabled: boolean): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/contactless?enabled=${enabled}`, {});
    }

    toggleInternational(id: number, enabled: boolean): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.put<MessageResponse>(`${this.baseUrl}/${id}/international?enabled=${enabled}`, {});
    }

    setCardLimits(id: number, data: SetCardLimitsRequest): Observable<CardLimitsResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.put<CardLimitsResponse>(`${this.baseUrl}/${id}/limits`, data);
    }

    cancelCard(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid card ID');
        }
        return this.api.delete<MessageResponse>(`${this.baseUrl}/${id}`);
    }

    // Health check
    checkHealth(): Observable<string> {
        return this.api.get<string>(`${this.baseUrl}/health`);
    }
}
