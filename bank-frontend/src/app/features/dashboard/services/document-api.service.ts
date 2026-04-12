import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DocumentAccessResponse, DocumentType, DocumentUploadResponse } from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class DocumentApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/documents`;

    uploadDocument(file: File, documentType: DocumentType): Observable<DocumentUploadResponse> {
        const payload = new FormData();
        payload.append('file', file);
        payload.append('documentType', documentType);

        return this.http.post<DocumentUploadResponse>(`${this.baseUrl}/upload`, payload);
    }

    getLatestKycDocument(userId: number): Observable<DocumentAccessResponse> {
        return this.http.get<DocumentAccessResponse>(`${this.baseUrl}/${userId}/kyc`);
    }
}
