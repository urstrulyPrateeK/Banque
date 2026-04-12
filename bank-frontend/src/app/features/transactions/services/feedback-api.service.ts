import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { FeedbackRequest, MessageResponse } from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class FeedbackApiService {
    private readonly api = inject(ApiService);

    submitFeedback(payload: FeedbackRequest): Observable<MessageResponse> {
        return this.api.post<MessageResponse>('/feedback', payload);
    }
}
