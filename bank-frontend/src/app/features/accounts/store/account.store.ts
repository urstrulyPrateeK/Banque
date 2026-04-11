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
import { AccountApiService } from '../services/account-api.service';
import { NotificationService } from '@core/services/notification.service';
import {
    Account,
    AllAccountsSummaryResponse,
    AccountStatisticsResponse,
    CreateAccountRequest,
    UpdateAccountRequest
} from '@core/models';

interface AccountState {
    accounts: Account[];
    summary: AllAccountsSummaryResponse | null;
    statistics: AccountStatisticsResponse | null;
    currentAccount: Account | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AccountState = {
    accounts: [],
    summary: null,
    statistics: null,
    currentAccount: null,
    isLoading: false,
    error: null,
};

export const AccountStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ accounts, summary }) => ({
        totalBalance: computed(() => summary()?.totalBalance ?? 0),
        activeAccountsCount: computed(() => summary()?.activeAccounts ?? 0),
        primaryAccount: computed(() => accounts().find(a => a.isPrimary) ?? null),
        savingsAccounts: computed(() => accounts().filter(a => a.accountType === 'SAVINGS')),
        checkingAccounts: computed(() => accounts().filter(a => a.accountType === 'CHECKING')),
    })),
    withMethods(
        (
            store,
            accountApi = inject(AccountApiService),
            notificationService = inject(NotificationService)
        ) => ({
            loadAllAccounts: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() =>
                        accountApi.getAllAccountsSummary().pipe(
                            tapResponse({
                                next: (summary) => patchState(store, {
                                    summary,
                                    accounts: summary?.accounts || [],
                                    isLoading: false,
                                    error: null
                                }),
                                error: (err: any) => {
                                    // Handle case where user has no accounts (404 or empty response)
                                    if (err.status === 404 || err.status === 204) {
                                        patchState(store, {
                                            accounts: [],
                                            summary: null,
                                            isLoading: false,
                                            error: null
                                        });
                                    } else {
                                        patchState(store, { 
                                            error: err.message || 'Failed to load accounts', 
                                            isLoading: false 
                                        });
                                    }
                                },
                            })
                        )
                    )
                )
            ),

            loadStatistics: rxMethod<void>(
                pipe(
                    switchMap(() =>
                        accountApi.getAccountStatistics().pipe(
                            tapResponse({
                                next: (statistics) => patchState(store, { statistics }),
                                error: (err: any) => console.error('Stats load failed', err),
                            })
                        )
                    )
                )
            ),

            getAccountDetails: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, currentAccount: null, error: null })),
                    switchMap((id) => {
                        // Validate ID before making API call
                        if (!id || Number.isNaN(id) || id <= 0) {
                            patchState(store, { 
                                error: 'Invalid account ID', 
                                isLoading: false 
                            });
                            return [];
                        }
                        return accountApi.getAccount(id).pipe(
                            tapResponse({
                                next: (account) => patchState(store, { 
                                    currentAccount: account, 
                                    isLoading: false,
                                    error: null 
                                }),
                                error: (err: any) => {
                                    if (err.status === 404) {
                                        patchState(store, { 
                                            error: 'Account not found', 
                                            isLoading: false,
                                            currentAccount: null
                                        });
                                    } else {
                                        patchState(store, { 
                                            error: err.message || 'Failed to load account details', 
                                            isLoading: false 
                                        });
                                    }
                                },
                            })
                        );
                    })
                )
            ),

            createAccount: rxMethod<CreateAccountRequest>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((data) =>
                        accountApi.createAccount(data).pipe(
                            tapResponse({
                                next: (newAccount) => {
                                    patchState(store, (state) => ({
                                        accounts: [...state.accounts, newAccount],
                                        isLoading: false
                                    }));
                                    notificationService.success('Account created successfully');
                                },
                                error: (err: any) => {
                                    patchState(store, { error: err.message, isLoading: false });
                                    notificationService.error(err.message || 'Failed to create account');
                                },
                            })
                        )
                    )
                )
            ),

            updateAccount: rxMethod<{ id: number; data: UpdateAccountRequest }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(({ id, data }) =>
                        accountApi.updateAccount(id, data).pipe(
                            tapResponse({
                                next: (updatedAccount) => {
                                    patchState(store, (state) => ({
                                        accounts: state.accounts.map(a => a.id === id ? updatedAccount : a),
                                        currentAccount: state.currentAccount?.id === id ? updatedAccount : state.currentAccount,
                                        isLoading: false
                                    }));
                                    notificationService.success('Account updated');
                                },
                                error: (err: any) => {
                                    patchState(store, { error: err.message, isLoading: false });
                                    notificationService.error('Failed to update account');
                                },
                            })
                        )
                    )
                )
            ),

            setPrimary: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        accountApi.setPrimaryAccount(id).pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, (state) => ({
                                        accounts: state.accounts.map(a => ({
                                            ...a,
                                            isPrimary: a.id === id
                                        })),
                                        isLoading: false
                                    }));
                                    notificationService.success('Primary account updated');
                                },
                                error: (err: any) => {
                                    patchState(store, { error: err.message, isLoading: false });
                                    notificationService.error('Failed to set primary account');
                                },
                            })
                        )
                    )
                )
            ),

            freezeAccount: rxMethod<{ id: number; reason: string }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(({ id, reason }) =>
                        accountApi.freezeAccount(id, reason).pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, (state) => ({
                                        accounts: state.accounts.map(a => a.id === id ? { ...a, status: 'FROZEN' } : a),
                                        currentAccount: state.currentAccount?.id === id ? { ...state.currentAccount, status: 'FROZEN' } as Account : state.currentAccount,
                                        isLoading: false
                                    }));
                                    notificationService.warning('Account frozen');
                                },
                                error: (err: any) => {
                                    patchState(store, { error: err.message, isLoading: false });
                                    notificationService.error('Failed to freeze account');
                                },
                            })
                        )
                    )
                )
            ),

            unfreezeAccount: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        accountApi.unfreezeAccount(id).pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, (state) => ({
                                        accounts: state.accounts.map(a => a.id === id ? { ...a, status: 'ACTIVE' } : a),
                                        currentAccount: state.currentAccount?.id === id ? { ...state.currentAccount, status: 'ACTIVE' } as Account : state.currentAccount,
                                        isLoading: false
                                    }));
                                    notificationService.success('Account unfrozen');
                                },
                                error: (err: any) => {
                                    patchState(store, { error: err.message, isLoading: false });
                                    notificationService.error('Failed to unfreeze account');
                                },
                            })
                        )
                    )
                )
            ),
        })
    )
);
