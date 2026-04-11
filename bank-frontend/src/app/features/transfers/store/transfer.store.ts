import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { TransferApiService, GetAllTransfersParams } from '../services/transfer-api.service';
import {
  Transfer,
  TransferResponse,
  TransferStatisticsResponse,
  TransferLimitsResponse,
  VerifyAccountResponse,
  RecurringTransferResponse,
  TransferReceiptResponse,
  InternalTransferRequest,
  ExternalTransferRequest,
  ScheduledTransferRequest,
  RecurringTransferRequest,
  VerifyAccountRequest,
  Pageable,
  PageTransferResponse,
  PageRecurringTransferResponse
} from '@core/models';
import { NotificationService } from '@core/services';

interface TransferState {
  transfers: Transfer[];
  pagination: PageTransferResponse | null;
  pendingTransfers: Transfer[];
  pendingPagination: PageTransferResponse | null;
  scheduledTransfers: TransferResponse[];
  scheduledPagination: PageTransferResponse | null;
  recurringTransfers: RecurringTransferResponse[];
  recurringPagination: PageRecurringTransferResponse | null;
  isLoading: boolean;
  error: string | null;
  filter: Omit<GetAllTransfersParams, 'pageable'>;
  pageable: Pageable;
  selectedTransfer: Transfer | null;
  statistics: TransferStatisticsResponse | null;
  limits: TransferLimitsResponse | null;
  verificationResult: VerifyAccountResponse | null;
  receipt: TransferReceiptResponse | null;
  lastCreatedTransferId: number | null;
}

const initialState: TransferState = {
  transfers: [],
  pagination: null,
  pendingTransfers: [],
  pendingPagination: null,
  scheduledTransfers: [],
  scheduledPagination: null,
  recurringTransfers: [],
  recurringPagination: null,
  isLoading: false,
  error: null,
  filter: {},
  pageable: { page: 0, size: 10 },
  selectedTransfer: null,
  statistics: null,
  limits: null,
  verificationResult: null,
  receipt: null,
  lastCreatedTransferId: null,
};

export const TransferStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ pagination, selectedTransfer, statistics, limits, verificationResult }) => ({
    totalRecords: computed(() => pagination()?.totalElements ?? 0),
    totalPages: computed(() => pagination()?.totalPages ?? 0),
    selectedTransferDetails: computed(() => selectedTransfer()),
    transferStats: computed(() => statistics()),
    transferLimits: computed(() => limits()),
    accountVerification: computed(() => verificationResult()),
  })),
  withMethods(
    (
      store,
      transferApiService = inject(TransferApiService),
      notificationService = inject(NotificationService)
    ) => ({
      // Core transfer loading
      loadTransfers: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            const params: GetAllTransfersParams = {
              ...store.filter(),
              pageable: store.pageable(),
            };
            return transferApiService.getAllTransfers(params).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, {
                    transfers: response.content,
                    pagination: { ...response },
                    isLoading: false,
                  });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load transfers',
                    isLoading: false,
                  });
                  notificationService.error('Failed to load transfers');
                },
              })
            );
          })
        )
      ),

      loadPendingTransfers: rxMethod<Pageable | undefined>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((pageable) => transferApiService.getPendingTransfers(pageable).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, {
                  pendingTransfers: response.content,
                  pendingPagination: response,
                  isLoading: false,
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load pending transfers',
                  isLoading: false,
                });
                notificationService.error('Failed to load pending transfers');
              },
            })
          ))
        )
      ),

      loadScheduledTransfers: rxMethod<Pageable>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((pageable) => transferApiService.getScheduledTransfers(pageable).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, {
                  scheduledTransfers: response.content,
                  scheduledPagination: response,
                  isLoading: false,
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load scheduled transfers',
                  isLoading: false,
                });
                notificationService.error('Failed to load scheduled transfers');
              },
            })
          ))
        )
      ),

      loadRecurringTransfers: rxMethod<Pageable>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((pageable) => transferApiService.getRecurringTransfers(pageable).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, {
                  recurringTransfers: response.content,
                  recurringPagination: response,
                  isLoading: false,
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load recurring transfers',
                  isLoading: false,
                });
                notificationService.error('Failed to load recurring transfers');
              },
            })
          ))
        )
      ),

      // Transfer creation
      internalTransfer: rxMethod<InternalTransferRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transferApiService.internalTransfer(data).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, (state) => ({
                    transfers: [response, ...state.transfers],
                    isLoading: false,
                    lastCreatedTransferId: response.id,
                  }));
                  notificationService.success('Internal transfer created successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create internal transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to create internal transfer');
                },
              })
            )
          )
        )
      ),

      externalTransfer: rxMethod<ExternalTransferRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transferApiService.externalTransfer(data).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, (state) => ({
                    transfers: [response, ...state.transfers],
                    isLoading: false,
                    lastCreatedTransferId: response.id,
                  }));
                  notificationService.success('External transfer created successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create external transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to create external transfer');
                },
              })
            )
          )
        )
      ),

      scheduledTransfer: rxMethod<ScheduledTransferRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transferApiService.scheduledTransfer(data).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, (state) => ({
                    transfers: [response, ...state.transfers],
                    isLoading: false,
                    lastCreatedTransferId: response.id,
                  }));
                  notificationService.success('Scheduled transfer created successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create scheduled transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to create scheduled transfer');
                },
              })
            )
          )
        )
      ),

      recurringTransfer: rxMethod<RecurringTransferRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transferApiService.recurringTransfer(data).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, (state) => ({
                    recurringTransfers: [response, ...state.recurringTransfers],
                    isLoading: false,
                  }));
                  notificationService.success('Recurring transfer created successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create recurring transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to create recurring transfer');
                },
              })
            )
          )
        )
      ),

      // Transfer details and operations
      getTransfer: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transferApiService.getTransfer(id).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { selectedTransfer: response, isLoading: false });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load transfer',
                    isLoading: false,
                  });
                  notificationService.error('Failed to load transfer details');
                },
              })
            )
          )
        )
      ),

      getReceipt: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transferApiService.getReceipt(id).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { receipt: response, isLoading: false });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load receipt',
                    isLoading: false,
                  });
                  notificationService.error('Failed to load transfer receipt');
                },
              })
            )
          )
        )
      ),

      cancelTransfer: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transferApiService.cancelTransfer(id).pipe(
              tapResponse({
                next: () => {
                  patchState(store, (state) => ({
                    transfers: state.transfers.map(t =>
                      t.id === id ? { ...t, status: 'CANCELLED' } : t
                    ),
                    isLoading: false,
                  }));
                  notificationService.success('Transfer cancelled successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to cancel transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to cancel transfer');
                },
              })
            )
          )
        )
      ),

      cancelRecurringTransfer: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transferApiService.cancelRecurringTransfer(id).pipe(
              tapResponse({
                next: () => {
                  patchState(store, (state) => ({
                    recurringTransfers: state.recurringTransfers.map(t =>
                      t.id === id ? { ...t, isActive: false } : t
                    ),
                    isLoading: false,
                  }));
                  notificationService.success('Recurring transfer cancelled successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to cancel recurring transfer',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to cancel recurring transfer');
                },
              })
            )
          )
        )
      ),

      // Statistics and limits
      loadStatistics: rxMethod<{ startDate?: string; endDate?: string }>(
        pipe(
          switchMap(({ startDate, endDate }) =>
            transferApiService.getStatistics(startDate, endDate).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { statistics: response });
                },
                error: (error: Error) => {
                  console.error('Failed to load statistics:', error);
                  notificationService.error('Failed to load transfer statistics');
                },
              })
            )
          )
        )
      ),

      loadLimits: rxMethod<void>(
        pipe(
          switchMap(() =>
            transferApiService.getTransferLimits().pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { limits: response });
                },
                error: (error: Error) => {
                  console.error('Failed to load limits:', error);
                  notificationService.error('Failed to load transfer limits');
                },
              })
            )
          )
        )
      ),

      // Account verification
      verifyAccount: rxMethod<VerifyAccountRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transferApiService.verifyAccount(data).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { verificationResult: response, isLoading: false });
                  notificationService.success('Account verified successfully');
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to verify account',
                    isLoading: false,
                  });
                  notificationService.error(error.message || 'Failed to verify account');
                },
              })
            )
          )
        )
      ),

      // Utility methods
      setFilter(filter: Partial<Omit<GetAllTransfersParams, 'pageable'>>) {
        patchState(store, { filter: { ...store.filter(), ...filter }, pageable: { ...store.pageable(), page: 0 } });
        this.loadTransfers();
      },
      setPage(page: number) {
        patchState(store, { pageable: { ...store.pageable(), page } });
        this.loadTransfers();
      },
      setPageSize(size: number) {
        patchState(store, { pageable: { ...store.pageable(), size, page: 0 } });
        this.loadTransfers();
      },
      setSort(sort: string[]) {
        patchState(store, { pageable: { ...store.pageable(), sort } });
        this.loadTransfers();
      },

      // Reset methods
      clearError(): void {
        patchState(store, { error: null });
      },
      clearSelectedTransfer(): void {
        patchState(store, { selectedTransfer: null });
      },
      clearReceipt(): void {
        patchState(store, { receipt: null });
      },
      clearVerificationResult(): void {
        patchState(store, { verificationResult: null });
      },
      clearLastCreatedTransferId(): void {
        patchState(store, { lastCreatedTransferId: null });
      }
    })
  )
);
