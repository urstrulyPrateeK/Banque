// Banque — Card API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';
import { MessageResponse, Pageable } from '@core/models';

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

@Injectable({ providedIn: 'root' })
export class CardApiService {
    private readonly fs = inject(FirestoreService);
    private get col() { return this.fs.userCollection('cards'); }

    getAllCards(params: GetAllCardsParams): Observable<any> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((cards) => {
                let filtered = [...cards];
                if (params.type) filtered = filtered.filter((c) => c.type === params.type);
                if (params.status) filtered = filtered.filter((c) => c.status === params.status);
                return { content: filtered, totalElements: filtered.length, totalPages: 1 };
            })
        );
    }

    getCard(id: number | string): Observable<any> {
        return from(this.fs.getDocument<any>(`${this.col}/${id}`)).pipe(
            map((c) => { if (!c) throw new Error('Card not found'); return c; })
        );
    }

    getCardDetails(id: number | string): Observable<any> { return this.getCard(id); }

    getCardLimits(id: number | string): Observable<any> {
        return of({ dailyLimit: 5000, monthlyLimit: 50000, onlineLimit: 10000, atmLimit: 2000 });
    }

    getCardStatement(): Observable<any> { return of({ transactions: [] }); }

    getCardTransactions(params: GetCardTransactionsParams): Observable<any> {
        return of({ content: [], totalElements: 0, totalPages: 0 });
    }

    getCardTypes(): Observable<any> {
        return of({ types: ['DEBIT', 'CREDIT', 'PREPAID'] });
    }

    getStatistics(): Observable<any> {
        return from(this.fs.getCollection<any>(this.col)).pipe(
            map((cards) => ({
                totalCards: cards.length,
                activeCards: cards.filter((c: any) => c.status === 'ACTIVE').length,
                blockedCards: cards.filter((c: any) => c.status === 'BLOCKED').length,
            }))
        );
    }

    requestCard(data: any): Observable<any> {
        const card: Record<string, unknown> = {
            type: data.type || 'DEBIT',
            cardNumber: this.generateCardNumber(),
            expiryDate: this.generateExpiry(),
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            cardholderName: data.cardholderName || 'Prateek Singh',
            accountId: data.accountId,
            status: 'ACTIVE',
            onlineEnabled: true,
            contactlessEnabled: true,
            internationalEnabled: false,
            createdAt: new Date().toISOString(),
        };
        return from(this.fs.addDocument(this.col, card)).pipe(map((id) => ({ ...card, id })));
    }

    activateCard(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'ACTIVE' })).pipe(map(() => ({ message: 'Card activated' })));
    }

    changePin(id: number | string): Observable<MessageResponse> {
        return of({ message: 'PIN changed successfully' });
    }

    blockCard(id: number | string, reason: string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'BLOCKED', blockReason: reason })).pipe(map(() => ({ message: 'Card blocked' })));
    }

    unblockCard(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'ACTIVE', blockReason: null })).pipe(map(() => ({ message: 'Card unblocked' })));
    }

    reportLost(id: number | string): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { status: 'LOST' })).pipe(map(() => ({ message: 'Card reported lost' })));
    }

    replaceCard(id: number | string): Observable<any> {
        return this.requestCard({});
    }

    toggleOnlineTransactions(id: number | string, enabled: boolean): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { onlineEnabled: enabled })).pipe(map(() => ({ message: `Online transactions ${enabled ? 'enabled' : 'disabled'}` })));
    }

    toggleContactless(id: number | string, enabled: boolean): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { contactlessEnabled: enabled })).pipe(map(() => ({ message: `Contactless ${enabled ? 'enabled' : 'disabled'}` })));
    }

    toggleInternational(id: number | string, enabled: boolean): Observable<MessageResponse> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { internationalEnabled: enabled })).pipe(map(() => ({ message: `International transactions ${enabled ? 'enabled' : 'disabled'}` })));
    }

    setCardLimits(id: number | string, data: any): Observable<any> {
        return from(this.fs.updateDocument(`${this.col}/${id}`, { limits: data })).pipe(map(() => data));
    }

    cancelCard(id: number | string): Observable<MessageResponse> {
        return from(this.fs.deleteDocument(`${this.col}/${id}`)).pipe(map(() => ({ message: 'Card cancelled' })));
    }

    checkHealth(): Observable<string> { return of('OK'); }

    private generateCardNumber(): string {
        const prefix = '4520';
        let num = prefix;
        for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10);
        return num;
    }

    private generateExpiry(): string {
        const now = new Date();
        const year = now.getFullYear() + 3;
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${month}/${year}`;
    }
}
