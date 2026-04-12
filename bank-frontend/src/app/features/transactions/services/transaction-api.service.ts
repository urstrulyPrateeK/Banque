// Banque — Transaction API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
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
    query?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    pageable: Pageable;
}

@Injectable({ providedIn: 'root' })
export class TransactionApiService {
    private readonly fs = inject(FirestoreService);
    private get col() { return this.fs.userCollection('transactions'); }

    getAllTransactions(params: GetAllTransactionsParams): Observable<PageTransactionResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((txns) => {
                let filtered = [...txns];
                if (params.type) filtered = filtered.filter((t) => t.transactionType === params.type);
                if (params.status) filtered = filtered.filter((t) => t.status === params.status);
                if (params.query) {
                    const q = params.query.toLowerCase();
                    filtered = filtered.filter((t: any) =>
                        (t.description || '').toLowerCase().includes(q) ||
                        (t.reference || '').toLowerCase().includes(q)
                    );
                }
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
                } as PageTransactionResponse;
            })
        );
    }

    getTransaction(id: number | string): Observable<TransactionResponse> {
        return from(this.fs.getDocument<TransactionResponse>(`${this.col}/${id}`)).pipe(
            map((t) => { if (!t) throw new Error('Not found'); return t; })
        );
    }

    getReceipt(id: number | string): Observable<TransactionReceiptResponse> {
        return this.getTransaction(id).pipe(map((t) => ({
            transactionId: typeof t.id === 'string' ? parseInt(t.id, 10) || 0 : t.id,
            reference: t.reference || `TXN-${t.id}`, transactionType: t.transactionType,
            amount: t.amount, currency: t.currency || 'USD', description: t.description,
            status: t.status, accountNumber: '', accountType: '', transactionDate: t.createdAt,
        })));
    }

    getStatistics(accountId?: number, startDate?: string, endDate?: string): Observable<TransactionStatisticsResponse> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((txns) => {
                const deposits = txns.filter((t: any) => t.transactionType === 'DEPOSIT');
                const withdrawals = txns.filter((t: any) => t.transactionType === 'WITHDRAWAL');
                return {
                    totalTransactions: txns.length,
                    totalDeposits: deposits.reduce((s: number, t: any) => s + (t.amount || 0), 0),
                    totalWithdrawals: withdrawals.reduce((s: number, t: any) => s + (t.amount || 0), 0),
                    depositCount: deposits.length,
                    withdrawalCount: withdrawals.length,
                    pendingCount: txns.filter((t: any) => t.status === 'PENDING').length,
                    failedCount: txns.filter((t: any) => t.status === 'FAILED').length,
                };
            })
        );
    }

    getRecentTransactions(accountId?: number, _limit?: number, pageable?: Pageable): Observable<PageTransactionResponse> {
        return this.getAllTransactions({ accountId, pageable: pageable || { page: 0, size: _limit || 10 } });
    }

    getPendingTransactions(accountId?: number, pageable?: Pageable): Observable<PageTransactionResponse> {
        return this.getAllTransactions({ status: 'PENDING', pageable: pageable || { page: 0, size: 10 } });
    }

    getCategories(): Observable<TransactionCategoriesResponse> {
        return of({ types: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'], statuses: ['COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'] });
    }

    deposit(data: DepositRequest): Observable<TransactionResponse> {
        const txn: Record<string, unknown> = {
            transactionType: 'DEPOSIT', amount: data.amount,
            description: data.description || 'Deposit', accountId: data.accountId,
            status: 'COMPLETED', currency: 'USD', reference: `DEP-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.depositHelper(data, txn)).pipe(
            map((id) => ({ ...txn, id } as unknown as TransactionResponse))
        );
    }

    private async depositHelper(data: DepositRequest, txn: Record<string, unknown>): Promise<string> {
        const id = await this.fs.addDocument(this.col, txn);
        try {
            const accounts = await this.fs.getCollection<any>(this.fs.userCollection('accounts'));
            const account = accounts.find((a: any) => a.id === String(data.accountId));
            if (account?.id) {
                await this.fs.updateDocument(`${this.fs.userCollection('accounts')}/${account.id}`, { balance: (account.balance || 0) + (data.amount || 0) });
            }
        } catch { /* ignore */ }
        return id;
    }

    withdraw(data: WithdrawRequest): Observable<TransactionResponse> {
        const txn: Record<string, unknown> = {
            transactionType: 'WITHDRAWAL', amount: data.amount,
            description: data.description || 'Withdrawal', accountId: data.accountId,
            status: 'COMPLETED', currency: 'USD', reference: `WTH-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        return from(this.withdrawHelper(data, txn)).pipe(
            map((id) => ({ ...txn, id } as unknown as TransactionResponse))
        );
    }

    private async withdrawHelper(data: WithdrawRequest, txn: Record<string, unknown>): Promise<string> {
        const id = await this.fs.addDocument(this.col, txn);
        try {
            const accounts = await this.fs.getCollection<any>(this.fs.userCollection('accounts'));
            const account = accounts.find((a: any) => a.id === String(data.accountId));
            if (account?.id) {
                await this.fs.updateDocument(`${this.fs.userCollection('accounts')}/${account.id}`, { balance: Math.max(0, (account.balance || 0) - (data.amount || 0)) });
            }
        } catch { /* ignore */ }
        return id;
    }

    searchTransactions(data: SearchTransactionRequest, pageable: Pageable): Observable<PageTransactionResponse> {
        return this.getAllTransactions({ query: data.query, pageable });
    }

    exportTransactions(data: ExportTransactionsRequest): Observable<Blob> {
        return of(new Blob(['Export not available in Firestore mode'], { type: 'text/plain' }));
    }

    raiseDispute(id: number | string, data: RaiseDisputeRequest): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'DISPUTED', disputeReason: data.reason })).pipe(
            map(() => ({ message: 'Dispute raised successfully' }))
        );
    }

    cancelTransaction(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'CANCELLED' })).pipe(
            map(() => ({ message: 'Transaction cancelled' }))
        );
    }

    checkHealth(): Observable<string> { return of('OK'); }
}
