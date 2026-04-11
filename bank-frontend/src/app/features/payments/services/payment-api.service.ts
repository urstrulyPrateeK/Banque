import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    BillPaymentRequest,
    MerchantPaymentRequest,
    MessageResponse,
    Pageable,
    PagePaymentResponse,
    PageRecurringPaymentResponse,
    PageSavedBillerResponse,
    PaymentCategoriesResponse,
    PaymentReceiptResponse,
    PaymentResponse,
    PaymentStatisticsResponse,
    RecurringPaymentRequest,
    RecurringPaymentResponse,
    SaveBillerRequest,
    SavedBillerResponse,
    SchedulePaymentRequest,
    UtilityPaymentRequest,
} from '@core/models';

export interface GetAllPaymentsParams {
    accountId?: number;
    type?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    pageable: Pageable;
}

@Injectable({
    providedIn: 'root',
})
export class PaymentApiService {
    private readonly api = inject(ApiService);
    private readonly baseUrl = '/payments';

    // GET endpoints
    getAllPayments(params: GetAllPaymentsParams): Observable<PagePaymentResponse> {
        const sort = params.pageable.sort?.length ? params.pageable.sort : ['createdAt,desc'];
        const queryParams: Record<string, string | number | string[]> = {
            page: params.pageable.page,
            size: params.pageable.size,
            sort,
        };

        if (params.accountId) {
            queryParams['accountId'] = params.accountId;
        }
        if (params.type) {
            queryParams['type'] = params.type;
        }
        if (params.category) {
            queryParams['category'] = params.category;
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

        return this.api.get<PagePaymentResponse>(this.baseUrl, queryParams);
    }

    getPayment(id: number): Observable<PaymentResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid payment ID');
        }
        return this.api.get<PaymentResponse>(`${this.baseUrl}/${id}`);
    }

    getReceipt(id: number): Observable<PaymentReceiptResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid payment ID');
        }
        return this.api.get<PaymentReceiptResponse>(`${this.baseUrl}/${id}/receipt`);
    }

    getStatistics(startDate?: string, endDate?: string): Observable<PaymentStatisticsResponse> {
        const params: Record<string, string> = {};
        if (startDate) params['startDate'] = startDate;
        if (endDate) params['endDate'] = endDate;
        return this.api.get<PaymentStatisticsResponse>(`${this.baseUrl}/statistics`, params);
    }

    getPendingPayments(pageable?: Pageable): Observable<PagePaymentResponse> {
        const params: Record<string, string | number | string[]> = {
            page: pageable?.page || 0,
            size: pageable?.size || 20,
            sort: pageable?.sort?.length ? pageable.sort : ['createdAt,desc'],
        };
        return this.api.get<PagePaymentResponse>(`${this.baseUrl}/pending`, params);
    }

    getScheduledPayments(pageable: Pageable): Observable<PagePaymentResponse> {
        const params: Record<string, string | number | string[]> = {
            page: pageable.page,
            size: pageable.size,
            sort: pageable.sort?.length ? pageable.sort : ['scheduledDate,desc'],
        };
        return this.api.get<PagePaymentResponse>(`${this.baseUrl}/scheduled`, params);
    }

    getRecurringPayments(pageable: Pageable, activeOnly?: boolean): Observable<PageRecurringPaymentResponse> {
        const params: Record<string, string | number | string[] | boolean> = {
            page: pageable.page,
            size: pageable.size,
            sort: pageable.sort?.length ? pageable.sort : ['createdAt,desc'],
        };
        if (activeOnly !== undefined) {
            params['activeOnly'] = activeOnly;
        }
        return this.api.get<PageRecurringPaymentResponse>(`${this.baseUrl}/recurring`, params);
    }

    getCategories(): Observable<PaymentCategoriesResponse> {
        return this.api.get<PaymentCategoriesResponse>(`${this.baseUrl}/categories`);
    }

    getSavedBillers(pageable: Pageable, category?: string): Observable<PageSavedBillerResponse> {
        const params: Record<string, string | number | string[]> = {
            page: pageable.page,
            size: pageable.size,
            sort: pageable.sort?.length ? pageable.sort : ['createdAt,desc'],
        };
        if (category) {
            params['category'] = category;
        }
        return this.api.get<PageSavedBillerResponse>(`${this.baseUrl}/billers`, params);
    }

    // POST endpoints
    payBill(data: BillPaymentRequest): Observable<PaymentResponse> {
        return this.api.post<PaymentResponse>(`${this.baseUrl}/bills`, data);
    }

    payMerchant(data: MerchantPaymentRequest): Observable<PaymentResponse> {
        return this.api.post<PaymentResponse>(`${this.baseUrl}/merchants`, data);
    }

    payUtility(data: UtilityPaymentRequest): Observable<PaymentResponse> {
        return this.api.post<PaymentResponse>(`${this.baseUrl}/utilities`, data);
    }

    schedulePayment(data: SchedulePaymentRequest): Observable<PaymentResponse> {
        return this.api.post<PaymentResponse>(`${this.baseUrl}/scheduled`, data);
    }

    createRecurringPayment(data: RecurringPaymentRequest): Observable<RecurringPaymentResponse> {
        return this.api.post<RecurringPaymentResponse>(`${this.baseUrl}/recurring`, data);
    }

    saveBiller(data: SaveBillerRequest): Observable<SavedBillerResponse> {
        return this.api.post<SavedBillerResponse>(`${this.baseUrl}/billers`, data);
    }

    cancelPayment(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid payment ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/cancel`, {});
    }

    cancelRecurringPayment(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid recurring payment ID');
        }
        return this.api.post<MessageResponse>(`${this.baseUrl}/recurring/${id}/cancel`, {});
    }

    deleteBiller(id: number): Observable<MessageResponse> {
        if (!id || Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid biller ID');
        }
        return this.api.delete<MessageResponse>(`${this.baseUrl}/billers/${id}`);
    }

    // Health check
    checkHealth(): Observable<string> {
        return this.api.get<string>(`${this.baseUrl}/health`);
    }
}
