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
import { TransactionApiService, GetAllTransactionsParams } from '../services/transaction-api.service';
import {
  PageTransactionResponse,
  Transaction,
  TransactionResponse,
  TransactionStatisticsResponse,
  TransactionCategoriesResponse,
  TransactionReceiptResponse,
  DepositRequest,
  WithdrawRequest,
  RaiseDisputeRequest,
  SearchTransactionRequest,
  ExportTransactionsRequest
} from '@core/models';

interface TransactionState {
  transactions: Transaction[];
  pagination: PageTransactionResponse | null;
  isLoading: boolean;
  error: string | null;
  filter: Omit<GetAllTransactionsParams, 'pageable'>;
  pageable: { page: number; size: number; sort?: string[] };
  selectedTransaction: Transaction | null;
  statistics: TransactionStatisticsResponse | null;
  categories: TransactionCategoriesResponse | null;
  receipt: TransactionReceiptResponse | null;
}

const initialState: TransactionState = {
  transactions: [],
  pagination: null,
  isLoading: false,
  error: null,
  filter: {},
  pageable: { page: 0, size: 10 },
  selectedTransaction: null,
  statistics: null,
  categories: null,
  receipt: null,
};

export const TransactionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ transactions, pagination, selectedTransaction, statistics, categories }) => ({
    totalRecords: computed(() => pagination()?.totalElements ?? 0),
    totalPages: computed(() => pagination()?.totalPages ?? 0),
    selectedTransactionDetails: computed(() => selectedTransaction),
    transactionTypes: computed(() => categories()?.types ?? []),
    transactionStatuses: computed(() => categories()?.statuses ?? []),
    transactionStats: computed(() => statistics),
  })),
  withMethods(
    (
      store,
      transactionApiService = inject(TransactionApiService),
    ) => ({
      // Core transaction loading
      loadTransactions: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            const params: GetAllTransactionsParams = {
              ...store.filter(),
              pageable: store.pageable(),
            };
            return transactionApiService.getAllTransactions(params).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, {
                    transactions: response.content,
                    pagination: response,
                    isLoading: false,
                  });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load transactions',
                    isLoading: false,
                  });
                },
              })
            );
          })
        )
      ),

      // Transaction creation
      deposit: rxMethod<DepositRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transactionApiService.deposit(data).pipe(
              tapResponse({
                next: (response) => {
                  // Add new transaction to the list
                  patchState(store, (state) => ({
                    transactions: [response, ...state.transactions],
                    isLoading: false,
                  }));
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create deposit',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      withdraw: rxMethod<WithdrawRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transactionApiService.withdraw(data).pipe(
              tapResponse({
                next: (response) => {
                  // Add new transaction to the list
                  patchState(store, (state) => ({
                    transactions: [response, ...state.transactions],
                    isLoading: false,
                  }));
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to create withdrawal',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      // Transaction details and operations
      getTransaction: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transactionApiService.getTransaction(id).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { selectedTransaction: response, isLoading: false });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load transaction',
                    isLoading: false,
                  });
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
            transactionApiService.getReceipt(id).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { receipt: response, isLoading: false });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to load receipt',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      raiseDispute: rxMethod<{ id: number; data: RaiseDisputeRequest }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ id, data }) =>
            transactionApiService.raiseDispute(id, data).pipe(
              tapResponse({
                next: (response) => {
                  // Update the transaction status in the list
                  patchState(store, (state) => ({
                    transactions: state.transactions.map(t =>
                      t.id === id ? { ...t, status: 'DISPUTED' } : t
                    ),
                    isLoading: false,
                  }));
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to raise dispute',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      cancelTransaction: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            transactionApiService.cancelTransaction(id).pipe(
              tapResponse({
                next: (response) => {
                  // Update the transaction status in the list
                  patchState(store, (state) => ({
                    transactions: state.transactions.map(t =>
                      t.id === id ? { ...t, status: 'CANCELLED' } : t
                    ),
                    isLoading: false,
                  }));
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to cancel transaction',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      // Statistics and categories
      loadStatistics: rxMethod<{ accountId?: number; startDate?: string; endDate?: string }>(
        pipe(
          switchMap(({ accountId, startDate, endDate }) =>
            transactionApiService.getStatistics(accountId, startDate, endDate).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { statistics: response });
                },
                error: (error: Error) => {
                  console.error('Failed to load statistics:', error);
                },
              })
            )
          )
        )
      ),

      loadCategories: rxMethod<void>(
        pipe(
          switchMap(() =>
            transactionApiService.getCategories().pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, { categories: response });
                },
                error: (error: Error) => {
                  console.error('Failed to load categories:', error);
                },
              })
            )
          )
        )
      ),

      // Search and export
      searchTransactions: rxMethod<{ data: SearchTransactionRequest; pageable: any }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ data, pageable }) =>
            transactionApiService.searchTransactions(data, pageable).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, {
                    transactions: response.content,
                    pagination: response,
                    isLoading: false,
                  });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to search transactions',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      exportTransactions: rxMethod<ExportTransactionsRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((data) =>
            transactionApiService.exportTransactions(data).pipe(
              tapResponse({
                next: (blob) => {
                  // Handle file download
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `transactions-${new Date().toISOString()}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  patchState(store, { isLoading: false });
                },
                error: (error: Error) => {
                  patchState(store, {
                    error: error.message || 'Failed to export transactions',
                    isLoading: false,
                  });
                },
              })
            )
          )
        )
      ),

      // Utility methods
      setFilter(filter: Partial<Omit<GetAllTransactionsParams, 'pageable'>>) {
        patchState(store, { filter: { ...store.filter(), ...filter }, pageable: { ...store.pageable(), page: 0 } });
        this.loadTransactions();
      },
      setPage(page: number) {
        patchState(store, { pageable: { ...store.pageable(), page } });
        this.loadTransactions();
      },
      setPageSize(size: number) {
        patchState(store, { pageable: { ...store.pageable(), size, page: 0 } });
        this.loadTransactions();
      },
      setSort(sort: string[]) {
        patchState(store, { pageable: { ...store.pageable(), sort } });
        this.loadTransactions();
      },

      // Reset methods
      clearError(): void {
        patchState(store, { error: null });
      },
      clearSelectedTransaction(): void {
        patchState(store, { selectedTransaction: null });
      },
      clearReceipt(): void {
        patchState(store, { receipt: null });
      }
    })
  )
);
