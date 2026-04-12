import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountStore } from '../../store/account.store';

@Component({
    selector: 'app-account-list',
    standalone: true,
    imports: [CommonModule, RouterLink, CurrencyPipe],
    templateUrl: './account-list.component.html',
    styleUrl: './account-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent implements OnInit {
    protected readonly accountStore = inject(AccountStore);

    ngOnInit(): void {
        this.accountStore.loadAllAccounts();
        this.accountStore.loadStatistics();
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

    protected formatAccountNumber(accountNumber: string | undefined | null): string {
        if (!accountNumber || accountNumber.length < 4) return '****';
        return `****${accountNumber.slice(-4)}`;
    }
}
