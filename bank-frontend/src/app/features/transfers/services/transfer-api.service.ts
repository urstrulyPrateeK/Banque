// Banque — Transfer API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
import {
    MessageResponse,
    Pageable,
    PageTransferResponse,
    PageRecurringTransferResponse,
    RecurringTransferRequest,
    RecurringTransferResponse,
    ScheduledTransferRequest,
    Transfer,
    TransferResponse,
    VerifyAccountRequest,
    VerifyAccountResponse,
    InternalTransferRequest,
    ExternalTransferRequest,
    TransferReceiptResponse,
    TransferStatisticsResponse,
    TransferLimitsResponse,
} from '@core/models';

export interface GetAllTransfersParams {
    accountId?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    pageable: Pageable;
}

@Injectable({ providedIn: 'root' })
export class TransferApiService {
    private readonly fs = inject(FirestoreService);
    private get col() { return this.fs.userCollection('transfers'); }

    getAllTransfers(params: GetAllTransfersParams): Observable<PageTransferResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((transfers) => {
                let filtered = [...transfers];
                if (params.type) filtered = filtered.filter((t) => t.transferType === params.type);
                if (params.status) filtered = filtered.filter((t) => t.status === params.status);
                filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                const page = params.pageable.page;
                const size = params.pageable.size;
                return {
                    content: filtered.slice(page * size, (page + 1) * size),
                    totalElements: filtered.length,
                    totalPages: Math.ceil(filtered.length / size) || 1,
                    number: page, size,
                    sort: { empty: false, sorted: true, unsorted: false },
                    first: page === 0, last: (page + 1) * size >= filtered.length,
                    numberOfElements: Math.min(size, filtered.length - page * size),
                    pageable: { offset: page * size, sort: { empty: false, sorted: true, unsorted: false }, paged: true, pageNumber: page, pageSize: size, unpaged: false },
                    empty: filtered.length === 0,
                } as PageTransferResponse;
            })
        );
    }

    getTransfer(id: number | string): Observable<TransferResponse> {
        return from(this.fs.getDocument<TransferResponse>(`${this.col}/${id}`)).pipe(
            map((t) => { if (!t) throw new Error('Not found'); return t; })
        );
    }

    getReceipt(id: number | string): Observable<TransferReceiptResponse> {
        return this.getTransfer(id).pipe(map((t) => ({
            transferId: typeof t.id === 'string' ? parseInt(t.id, 10) || 0 : t.id,
            reference: t.reference || `TRF-${t.id}`, transferType: t.transferType,
            amount: t.amount, currency: t.currency || 'USD',
            fromAccountNumber: '', toAccountNumber: '',
            recipientName: t.recipientName || '', description: t.description,
            status: t.status, transferDate: t.createdAt,
        })));
    }

    getStatistics(startDate?: string, endDate?: string): Observable<TransferStatisticsResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((transfers) => ({
                totalTransfers: transfers.length,
                internalTransfers: transfers.filter((t: any) => t.transferType === 'INTERNAL').length,
                externalTransfers: transfers.filter((t: any) => t.transferType === 'EXTERNAL').length,
                totalAmount: transfers.reduce((s: number, t: any) => s + (t.amount || 0), 0),
                completedTransfers: transfers.filter((t: any) => t.status === 'COMPLETED').length,
                pendingTransfers: transfers.filter((t: any) => t.status === 'PENDING').length,
            }))
        );
    }

    getPendingTransfers(pageable?: Pageable): Observable<PageTransferResponse> {
        return this.getAllTransfers({ status: 'PENDING', pageable: pageable || { page: 0, size: 20 } });
    }

    getScheduledTransfers(pageable: Pageable): Observable<PageTransferResponse> {
        return this.getAllTransfers({ status: 'SCHEDULED', pageable });
    }

    getRecurringTransfers(pageable: Pageable, activeOnly?: boolean): Observable<PageRecurringTransferResponse> {
        return of({
            content: [], totalElements: 0, totalPages: 0, size: pageable.size, number: pageable.page,
            sort: { empty: true, sorted: false, unsorted: true }, first: true, last: true,
            numberOfElements: 0, pageable: { offset: 0, sort: { empty: true, sorted: false, unsorted: true }, paged: true, pageNumber: 0, pageSize: pageable.size, unpaged: false },
            empty: true,
        });
    }

    getTransferLimits(): Observable<TransferLimitsResponse> {
        return of({ maxInternalTransfer: 50000, maxExternalTransfer: 25000, dailyLimit: 100000 });
    }

    internalTransfer(data: InternalTransferRequest): Observable<TransferResponse> {
        const transfer: Record<string, unknown> = {
            transferType: 'INTERNAL', fromAccountId: data.fromAccountId, toAccountId: data.toAccountId,
            amount: data.amount, description: data.description || 'Internal transfer',
            status: 'COMPLETED', currency: 'USD', reference: `INT-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, transfer)).pipe(
            map((id) => ({ ...transfer, id } as unknown as TransferResponse))
        );
    }

    externalTransfer(data: ExternalTransferRequest): Observable<TransferResponse> {
        const transfer: Record<string, unknown> = {
            transferType: 'EXTERNAL', fromAccountId: data.fromAccountId,
            toAccountNumber: data.toAccountNumber, recipientName: data.recipientName,
            amount: data.amount, description: data.description || 'External transfer',
            status: 'COMPLETED', currency: 'USD', reference: `EXT-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, transfer)).pipe(
            map((id) => ({ ...transfer, id } as unknown as TransferResponse))
        );
    }

    scheduledTransfer(data: ScheduledTransferRequest): Observable<TransferResponse> {
        const transfer: Record<string, unknown> = {
            ...data, transferType: 'SCHEDULED', status: 'SCHEDULED',
            currency: 'USD', reference: `SCH-${Date.now()}`, createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, transfer)).pipe(map((id) => ({ ...transfer, id } as unknown as TransferResponse)));
    }

    recurringTransfer(data: RecurringTransferRequest): Observable<RecurringTransferResponse> {
        const transfer: Record<string, unknown> = {
            ...data, transferType: 'RECURRING', isActive: true,
            currency: 'USD', reference: `REC-${Date.now()}`, createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, transfer)).pipe(map((id) => ({ ...transfer, id } as unknown as RecurringTransferResponse)));
    }

    verifyAccount(data: VerifyAccountRequest): Observable<VerifyAccountResponse> {
        return of({ isValid: true, accountNumber: data.accountNumber, accountType: 'SAVINGS', message: 'Account verified' });
    }

    cancelTransfer(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'CANCELLED' })).pipe(map(() => ({ message: 'Transfer cancelled' })));
    }

    cancelRecurringTransfer(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { isActive: false, status: 'CANCELLED' })).pipe(map(() => ({ message: 'Recurring transfer cancelled' })));
    }

    checkHealth(): Observable<string> { return of('OK'); }
}
