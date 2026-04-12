// Banque — Account API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
import {
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
    AllAccountsSummaryResponse,
    AccountStatisticsResponse,
    MessageResponse,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
    private readonly fs = inject(FirestoreService);
    private get col() { return this.fs.userCollection('accounts'); }

    getAllAccountsSummary(): Observable<AllAccountsSummaryResponse> {
        return from(this.fs.getCollection<Account>(this.col)).pipe(
            map((accounts) => {
                const active = accounts.filter((a) => a.status === 'ACTIVE');
                return {
                    accounts,
                    totalAccounts: accounts.length,
                    activeAccounts: active.length,
                    totalBalance: accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
                };
            })
        );
    }

    getAccountStatistics(): Observable<AccountStatisticsResponse> {
        return from(this.fs.getCollection<Account>(this.col)).pipe(
            map((accounts) => ({
                savingsAccounts: accounts.filter((a) => a.accountType === 'SAVINGS').length,
                checkingAccounts: accounts.filter((a) => a.accountType === 'CHECKING').length,
                businessAccounts: accounts.filter((a) => a.accountType === 'BUSINESS').length,
                totalBalance: accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
                savingsBalance: accounts.filter((a) => a.accountType === 'SAVINGS').reduce((sum, a) => sum + (a.balance || 0), 0),
                checkingBalance: accounts.filter((a) => a.accountType === 'CHECKING').reduce((sum, a) => sum + (a.balance || 0), 0),
            }))
        );
    }

    getAllAccounts(): Observable<any> {
        return from(this.fs.getCollection<Account>(this.col)).pipe(
            map((accounts) => ({ content: accounts, totalElements: accounts.length, totalPages: 1 }))
        );
    }

    getAccount(id: number | string): Observable<Account> {
        return from(this.fs.getDocument<Account>(`${this.col}/${id}`)).pipe(
            map((acc) => {
                if (!acc) throw new Error('Account not found');
                return acc;
            })
        );
    }

    createAccount(data: CreateAccountRequest): Observable<Account> {
        const account: Record<string, unknown> = {
            accountType: data.accountType || 'SAVINGS',
            nickname: data.nickname || data.accountType || 'My Account',
            currency: data.currency || 'USD',
            balance: 0,
            status: 'ACTIVE',
            isPrimary: false,
            accountNumber: this.generateAccountNumber(),
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, account)).pipe(
            map((id) => ({ ...account, id } as unknown as Account))
        );
    }

    updateAccount(id: number | string, data: UpdateAccountRequest): Observable<Account> {
        return from(
            this.fs.updateDocument(`${this.col}/${id}`, data as Record<string, unknown>)
        ).pipe(
            map(() => ({ id, ...data } as unknown as Account))
        );
    }

    setPrimaryAccount(id: number | string): Observable<MessageResponse> {
        // First unset all, then set the target
        return from(this.setPrimaryHelper(String(id))).pipe(
            map(() => ({ message: 'Primary account updated' }))
        );
    }

    private async setPrimaryHelper(targetId: string): Promise<void> {
        const accounts = await this.fs.getCollection<any>(this.col);
        for (const acc of accounts) {
            if (acc.id) {
                await this.fs.updateDocument(`${this.col}/${acc.id}`, {
                    isPrimary: String(acc.id) === targetId,
                });
            }
        }
    }

    freezeAccount(id: number | string, reason: string): Observable<MessageResponse> {
        return from(
            this.fs.updateDocument(`${this.col}/${id}`, { status: 'FROZEN', freezeReason: reason })
        ).pipe(map(() => ({ message: 'Account frozen' })));
    }

    unfreezeAccount(id: number | string): Observable<MessageResponse> {
        return from(
            this.fs.updateDocument(`${this.col}/${id}`, { status: 'ACTIVE', freezeReason: null })
        ).pipe(map(() => ({ message: 'Account unfrozen' })));
    }

    closeAccount(id: number | string): Observable<MessageResponse> {
        return from(this.fs.deleteDocument(`${this.col}/${id}`)).pipe(
            map(() => ({ message: 'Account closed' }))
        );
    }

    getAccountSummary(id: number | string): Observable<any> {
        return this.getAccount(id);
    }

    getBalance(id: number | string): Observable<any> {
        return this.getAccount(id).pipe(map((a) => ({ balance: a.balance, currency: a.currency })));
    }

    getBalanceHistory(): Observable<any> {
        return of({ content: [], totalElements: 0, totalPages: 0 });
    }

    getAccountTypes(): Observable<any> {
        return of({ types: ['SAVINGS', 'CHECKING', 'BUSINESS'] });
    }

    getStatement(): Observable<any> {
        return of({ transactions: [], period: {} });
    }

    downloadStatement(): Observable<Blob> {
        return of(new Blob(['Statement not available in demo mode'], { type: 'text/plain' }));
    }

    checkHealth(): Observable<string> {
        return of('OK');
    }

    private generateAccountNumber(): string {
        const prefix = '4520';
        const rand = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        return `${prefix}${rand}`;
    }
}
