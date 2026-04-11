import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
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
  TransferLimitsResponse
} from '@core/models';

export interface GetAllTransfersParams {
  accountId?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  pageable: Pageable;
}

@Injectable({
  providedIn: 'root'
})
export class TransferApiService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/transfers';

  // GET endpoints
  getAllTransfers(params: GetAllTransfersParams): Observable<PageTransferResponse> {
    const sort = params.pageable.sort?.length ? params.pageable.sort : ['createdAt,desc'];
    const queryParams: Record<string, string | number | string[]> = {
      page: params.pageable.page,
      size: params.pageable.size,
      sort
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
    if (params.startDate) {
      queryParams['startDate'] = params.startDate;
    }
    if (params.endDate) {
      queryParams['endDate'] = params.endDate;
    }

    return this.api.get<PageTransferResponse>(this.baseUrl, queryParams);
  }

  getTransfer(id: number): Observable<TransferResponse> {
    if (!id || Number.isNaN(id) || id <= 0) {
      throw new Error('Invalid transfer ID');
    }
    return this.api.get<TransferResponse>(`${this.baseUrl}/${id}`);
  }

  getReceipt(id: number): Observable<TransferReceiptResponse> {
    if (!id || Number.isNaN(id) || id <= 0) {
      throw new Error('Invalid transfer ID');
    }
    return this.api.get<TransferReceiptResponse>(`${this.baseUrl}/${id}/receipt`);
  }

  getStatistics(startDate?: string, endDate?: string): Observable<TransferStatisticsResponse> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<TransferStatisticsResponse>(`${this.baseUrl}/statistics`, params);
  }

  getPendingTransfers(pageable?: Pageable): Observable<PageTransferResponse> {
    const params: Record<string, string | number | string[]> = {
      page: pageable?.page || 0,
      size: pageable?.size || 20,
      sort: pageable?.sort?.length ? pageable.sort : ['createdAt,desc']
    };
    return this.api.get<PageTransferResponse>(`${this.baseUrl}/pending`, params);
  }

  getScheduledTransfers(pageable: Pageable): Observable<PageTransferResponse> {
    const params: Record<string, string | number | string[]> = {
      page: pageable.page,
      size: pageable.size,
      sort: pageable.sort?.length ? pageable.sort : ['scheduledDate,desc']
    };
    return this.api.get<PageTransferResponse>(`${this.baseUrl}/scheduled`, params);
  }

  getRecurringTransfers(pageable: Pageable, activeOnly?: boolean): Observable<PageRecurringTransferResponse> {
    const params: Record<string, string | number | string[] | boolean> = {
      page: pageable.page,
      size: pageable.size,
      sort: pageable.sort?.length ? pageable.sort : ['createdAt,desc']
    };
    if (activeOnly !== undefined) {
      params['activeOnly'] = activeOnly;
    }
    return this.api.get<PageRecurringTransferResponse>(`${this.baseUrl}/recurring`, params);
  }

  getTransferLimits(): Observable<TransferLimitsResponse> {
    return this.api.get<TransferLimitsResponse>(`${this.baseUrl}/limits`);
  }

  // POST endpoints
  internalTransfer(data: InternalTransferRequest): Observable<TransferResponse> {
    return this.api.post<TransferResponse>(`${this.baseUrl}/internal`, data);
  }

  externalTransfer(data: ExternalTransferRequest): Observable<TransferResponse> {
    return this.api.post<TransferResponse>(`${this.baseUrl}/external`, data);
  }

  scheduledTransfer(data: ScheduledTransferRequest): Observable<TransferResponse> {
    return this.api.post<TransferResponse>(`${this.baseUrl}/scheduled`, data);
  }

  recurringTransfer(data: RecurringTransferRequest): Observable<RecurringTransferResponse> {
    return this.api.post<RecurringTransferResponse>(`${this.baseUrl}/recurring`, data);
  }

  verifyAccount(data: VerifyAccountRequest): Observable<VerifyAccountResponse> {
    return this.api.post<VerifyAccountResponse>(`${this.baseUrl}/verify-account`, data);
  }

  // POST endpoints for management
  cancelTransfer(id: number): Observable<MessageResponse> {
    if (!id || Number.isNaN(id) || id <= 0) {
      throw new Error('Invalid transfer ID');
    }
    return this.api.post<MessageResponse>(`${this.baseUrl}/${id}/cancel`, {});
  }

  cancelRecurringTransfer(id: number): Observable<MessageResponse> {
    if (!id || Number.isNaN(id) || id <= 0) {
      throw new Error('Invalid recurring transfer ID');
    }
    return this.api.post<MessageResponse>(`${this.baseUrl}/recurring/${id}/cancel`, {});
  }

  // Health check
  checkHealth(): Observable<string> {
    return this.api.get<string>(`${this.baseUrl}/health`);
  }
}
