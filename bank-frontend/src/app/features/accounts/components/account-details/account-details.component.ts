import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountStore } from '../../store/account.store';
import { AccountApiService } from '../../services/account-api.service';
import { AccountSummaryResponse, BalanceResponse } from '@core/models';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-account-details',
    standalone: true,
    imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
    templateUrl: './account-details.component.html',
    styleUrl: './account-details.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailsComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly accountStore = inject(AccountStore);
    private readonly accountApi = inject(AccountApiService);

    protected accountId = signal<number | null>(null);
    protected summary = signal<AccountSummaryResponse | null>(null);
    protected balance = signal<BalanceResponse | null>(null);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('id');
            if (idParam) {
                const accountId = Number.parseInt(idParam, 10);
                // Validate that the ID is a valid number
                if (!Number.isNaN(accountId) && accountId > 0) {
                    this.accountId.set(accountId);
                    this.accountStore.getAccountDetails(accountId);
                    this.loadAdditionalData(accountId);
                } else {
                    // Invalid ID - redirect to account list
                    this.router.navigate(['/accounts'], {
                        queryParams: { error: 'invalid_account_id' }
                    });
                }
            } else {
                // No ID provided - redirect to account list
                this.router.navigate(['/accounts']);
            }
        });
    }

    private loadAdditionalData(id: number): void {
        // Only load additional data if ID is valid
        if (!id || Number.isNaN(id) || id <= 0) {
            return;
        }

        this.accountApi.getAccountSummary(id).pipe(
            catchError(err => {
                // Handle 404 or other errors gracefully
                if (err.status === 404) {
                    console.warn('Account summary not found for account:', id);
                } else {
                    console.error('Failed to load summary:', err);
                }
                return of(null);
            })
        ).subscribe(summary => {
            if (summary) {
                this.summary.set(summary);
            }
        });

        this.accountApi.getBalance(id).pipe(
            catchError(err => {
                // Handle 404 or other errors gracefully
                if (err.status === 404) {
                    console.warn('Balance not found for account:', id);
                } else {
                    console.error('Failed to load balance:', err);
                }
                return of(null);
            })
        ).subscribe(balance => {
            if (balance) {
                this.balance.set(balance);
            }
        });
    }

    protected get account() {
        return this.accountStore.currentAccount();
    }

    protected get isLoading() {
        return this.accountStore.isLoading();
    }

    protected get error() {
        return this.accountStore.error();
    }

    protected getAccountTypeIcon(type: string): string {
        switch (type) {
            case 'SAVINGS':
                return '💰';
            case 'CHECKING':
                return '💳';
            case 'BUSINESS':
                return '🏢';
            default:
                return '🏦';
        }
    }

    protected getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'status-active';
            case 'FROZEN':
                return 'status-frozen';
            case 'CLOSED':
                return 'status-closed';
            default:
                return 'status-inactive';
        }
    }

    protected formatAccountNumber(accountNumber: string): string {
        if (!accountNumber) return '';
        return accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    protected onSetPrimary(): void {
        const id = this.accountId();
        if (id && !Number.isNaN(id) && id > 0) {
            this.accountStore.setPrimary(id);
        }
    }

    protected onFreezeAccount(): void {
        const id = this.accountId();
        if (id && !Number.isNaN(id) && id > 0) {
            const reason = prompt('Please provide a reason for freezing this account:');
            if (reason) {
                this.accountStore.freezeAccount({ id, reason });
            }
        }
    }

    protected onUnfreezeAccount(): void {
        const id = this.accountId();
        if (id && !Number.isNaN(id) && id > 0) {
            this.accountStore.unfreezeAccount(id);
        }
    }

    protected goBack(): void {
        this.router.navigate(['/accounts']);
    }

    protected onTransfer(): void {
        const id = this.accountId();
        if (id && !Number.isNaN(id) && id > 0) {
            // Navigate to transfers page with the account ID as a query parameter
            this.router.navigate(['/transfers'], {
                queryParams: { fromAccount: id }
            });
        }
    }
}
