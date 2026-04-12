// Banque — Feedback API Service (Firestore-backed)

import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '@core/firebase/firestore.service';

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
    private readonly fs = inject(FirestoreService);

    submitFeedback(data: { transactionId: number | string; positive?: boolean; rating?: string; comment?: string }): Observable<any> {
        return from(
            this.fs.addDocument(this.fs.userCollection('feedback'), {
                ...data,
                createdAt: new Date().toISOString(),
            })
        ).pipe(map((id) => ({ id, message: 'Feedback submitted' })));
    }
}
