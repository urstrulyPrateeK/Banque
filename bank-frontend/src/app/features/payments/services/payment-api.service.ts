// Banque — Payment API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
import {
    BillPaymentRequest, MerchantPaymentRequest, MessageResponse, Pageable,
    PagePaymentResponse, PageRecurringPaymentResponse, PageSavedBillerResponse,
    PaymentCategoriesResponse, PaymentReceiptResponse, PaymentResponse,
    PaymentStatisticsResponse, RecurringPaymentRequest, RecurringPaymentResponse,
    SaveBillerRequest, SavedBillerResponse, SchedulePaymentRequest, UtilityPaymentRequest,
} from '@core/models';

export interface GetAllPaymentsParams {
    accountId?: number; type?: string; category?: string;
    status?: string; startDate?: string; endDate?: string; pageable: Pageable;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
    private readonly fs = inject(FirestoreService);
    private get col() { return this.fs.userCollection('payments'); }

    getAllPayments(params: GetAllPaymentsParams): Observable<PagePaymentResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((payments) => {
                let filtered = [...payments];
                if (params.type) filtered = filtered.filter((p) => p.paymentType === params.type);
                if (params.status) filtered = filtered.filter((p) => p.status === params.status);
                if (params.category) filtered = filtered.filter((p) => p.category === params.category);
                filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                const page = params.pageable.page; const size = params.pageable.size;
                return {
                    content: filtered.slice(page * size, (page + 1) * size),
                    totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) || 1,
                    number: page, size,
                    sort: { empty: false, sorted: true, unsorted: false },
                    first: page === 0, last: (page + 1) * size >= filtered.length,
                    numberOfElements: Math.min(size, filtered.length - page * size),
                    pageable: { offset: page * size, sort: { empty: false, sorted: true, unsorted: false }, paged: true, pageNumber: page, pageSize: size, unpaged: false },
                    empty: filtered.length === 0,
                } as PagePaymentResponse;
            })
        );
    }

    getPayment(id: number | string): Observable<PaymentResponse> {
        return from(this.fs.getDocument<PaymentResponse>(`${this.col}/${id}`)).pipe(map((p) => { if (!p) throw new Error('Not found'); return p; }));
    }

    getReceipt(id: number | string): Observable<PaymentReceiptResponse> {
        return this.getPayment(id).pipe(map((p) => ({
            paymentId: typeof p.id === 'string' ? parseInt(p.id, 10) || 0 : p.id,
            reference: p.reference || `PMT-${p.id}`, paymentType: p.paymentType,
            category: p.category, amount: p.amount, currency: p.currency || 'USD',
            payeeName: p.payeeName, payeeAccount: p.payeeAccount, description: p.description,
            status: p.status, fromAccountNumber: '', paymentDate: p.createdAt,
        })));
    }

    getStatistics(startDate?: string, endDate?: string): Observable<PaymentStatisticsResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((payments) => ({
                totalPayments: payments.length,
                billPayments: payments.filter((p: any) => p.paymentType === 'BILL').length,
                utilityPayments: payments.filter((p: any) => p.paymentType === 'UTILITY').length,
                merchantPayments: payments.filter((p: any) => p.paymentType === 'MERCHANT').length,
                totalAmount: payments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
                completedPayments: payments.filter((p: any) => p.status === 'COMPLETED').length,
                pendingPayments: payments.filter((p: any) => p.status === 'PENDING').length,
            }))
        );
    }

    getPendingPayments(pageable?: Pageable): Observable<PagePaymentResponse> {
        return this.getAllPayments({ status: 'PENDING', pageable: pageable || { page: 0, size: 20 } });
    }

    getScheduledPayments(pageable: Pageable): Observable<PagePaymentResponse> {
        return this.getAllPayments({ status: 'SCHEDULED', pageable });
    }

    getRecurringPayments(pageable: Pageable, activeOnly?: boolean): Observable<PageRecurringPaymentResponse> {
        return of({
            content: [], totalElements: 0, totalPages: 0, size: pageable.size, number: pageable.page,
            sort: { empty: true, sorted: false, unsorted: true }, first: true, last: true,
            numberOfElements: 0, pageable: { offset: 0, sort: { empty: true, sorted: false, unsorted: true }, paged: true, pageNumber: 0, pageSize: pageable.size, unpaged: false },
            empty: true,
        });
    }

    getCategories(): Observable<PaymentCategoriesResponse> {
        return of({ categories: ['Electricity', 'Water', 'Internet', 'Phone', 'Insurance', 'Rent', 'Subscriptions'], types: ['BILL', 'UTILITY', 'MERCHANT'] });
    }

    getSavedBillers(pageable: Pageable, category?: string): Observable<PageSavedBillerResponse> {
        return of({
            content: [], totalElements: 0, totalPages: 0, size: pageable.size, number: pageable.page,
            sort: { empty: true, sorted: false, unsorted: true }, first: true, last: true,
            numberOfElements: 0, pageable: { offset: 0, sort: { empty: true, sorted: false, unsorted: true }, paged: true, pageNumber: 0, pageSize: pageable.size, unpaged: false },
            empty: true,
        });
    }

    payBill(data: BillPaymentRequest): Observable<PaymentResponse> {
        const payment: Record<string, unknown> = {
            paymentType: 'BILL', category: data.category, amount: data.amount,
            payeeName: data.billerName, payeeAccount: data.accountNumber,
            accountId: data.accountId, status: 'COMPLETED', currency: 'USD',
            reference: `BILL-${Date.now()}`, description: data.description || `Bill payment to ${data.billerName}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, payment)).pipe(map((id) => ({ ...payment, id } as unknown as PaymentResponse)));
    }

    payMerchant(data: MerchantPaymentRequest): Observable<PaymentResponse> {
        const payment: Record<string, unknown> = {
            paymentType: 'MERCHANT', category: data.category, amount: data.amount,
            payeeName: data.merchantName, accountId: data.accountId, status: 'COMPLETED',
            currency: 'USD', reference: `MRC-${Date.now()}`, description: data.description || `Payment to ${data.merchantName}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, payment)).pipe(map((id) => ({ ...payment, id } as unknown as PaymentResponse)));
    }

    payUtility(data: UtilityPaymentRequest): Observable<PaymentResponse> {
        const payment: Record<string, unknown> = {
            paymentType: 'UTILITY', category: data.utilityType, amount: data.amount,
            payeeName: data.providerName, accountId: data.accountId, status: 'COMPLETED',
            currency: 'USD', reference: `UTL-${Date.now()}`, description: data.description || 'Utility payment',
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, payment)).pipe(map((id) => ({ ...payment, id } as unknown as PaymentResponse)));
    }

    schedulePayment(data: SchedulePaymentRequest): Observable<PaymentResponse> {
        const payment: Record<string, unknown> = { ...data, status: 'SCHEDULED', currency: 'USD', reference: `SCH-${Date.now()}`, createdAt: new Date().toISOString() };
        return from(this.fs.addDocument(this.col, payment)).pipe(map((id) => ({ ...payment, id } as unknown as PaymentResponse)));
    }

    createRecurringPayment(data: RecurringPaymentRequest): Observable<RecurringPaymentResponse> {
        const payment: Record<string, unknown> = { ...data, isActive: true, currency: 'USD', reference: `REC-${Date.now()}`, createdAt: new Date().toISOString() };
        return from(this.fs.addDocument(this.col, payment)).pipe(map((id) => ({ ...payment, id } as unknown as RecurringPaymentResponse)));
    }

    saveBiller(data: SaveBillerRequest): Observable<SavedBillerResponse> {
        return from(this.fs.addDocument(this.fs.userCollection('billers'), { ...data, createdAt: new Date().toISOString() })).pipe(
            map((id) => ({ ...data, id } as unknown as SavedBillerResponse))
        );
    }

    cancelPayment(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'CANCELLED' })).pipe(map(() => ({ message: 'Payment cancelled' })));
    }

    cancelRecurringPayment(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { isActive: false, status: 'CANCELLED' })).pipe(map(() => ({ message: 'Recurring payment cancelled' })));
    }

    deleteBiller(id: number | string): Observable<MessageResponse> {
        return from(this.fs.deleteDocument(`${this.fs.userCollection('billers')}/${id}`)).pipe(map(() => ({ message: 'Biller removed' })));
    }

    checkHealth(): Observable<string> { return of('OK'); }
}
