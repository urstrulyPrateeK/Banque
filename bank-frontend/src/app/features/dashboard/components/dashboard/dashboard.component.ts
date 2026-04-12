import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthStore } from '@features/auth/store/auth.store';
import { AccountStore } from '@features/accounts/store/account.store';
import { TransactionApiService } from '@features/transactions/services/transaction-api.service';
import { TransactionResponse, TransactionStatisticsResponse } from '@core/models';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';

interface QuickAction {
    id: string;
    title: string;
    icon: string;
    route: string;
    color: string;
}

interface DashboardTransaction {
    id: number;
    type: 'credit' | 'debit';
    description: string;
    amount: number;
    date: string;
    status?: string;
}

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, DocumentUploadComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
    protected readonly authStore = inject(AuthStore);
    protected readonly accountStore = inject(AccountStore);
    private readonly transactionApi = inject(TransactionApiService);

    protected readonly isLoading = signal(true);
    protected readonly transactionStats = signal<TransactionStatisticsResponse | null>(null);
    protected readonly recentTransactions = signal<DashboardTransaction[]>([]);

    protected readonly accounts = computed(() => {
        const storeAccounts = this.accountStore.accounts();
        if (!storeAccounts || storeAccounts.length === 0) {
            return [];
        }

        return storeAccounts.slice(0, 3).map((account) => ({
            id: account.id,
            name: account.nickname || account.accountType,
            number: account.accountNumber ? `****${account.accountNumber.slice(-4)}` : '****',
            balance: account.balance ?? 0,
            type: account.accountType?.toLowerCase() || 'account',
            currency: account.currency || 'USD',
        }));
    });

    protected readonly totalBalance = computed(() => this.accountStore.summary()?.totalBalance ?? 0);
    protected readonly monthlySpend = computed(() => this.transactionStats()?.totalWithdrawals ?? 0);
    protected readonly activeAccounts = computed(() => this.accountStore.activeAccountsCount());
    protected readonly recentTransfersCount = computed(() => this.recentTransactions().length);

    protected readonly quickActions: QuickAction[] = [
        { id: 'transfer', title: 'Move Funds', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', route: '/transfers', color: 'blue' },
        { id: 'pay', title: 'Schedule Payment', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', route: '/payments', color: 'green' },
        { id: 'cards', title: 'Manage Cards', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', route: '/cards', color: 'purple' },
        { id: 'history', title: 'Search History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/transactions', color: 'orange' },
    ];

    protected readonly greeting = computed(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    });

    protected readonly inflowVsOutflow = computed(() => {
        const stats = this.transactionStats();
        if (!stats || stats.totalDeposits === 0) {
            return 0;
        }
        return Math.max(0, Math.round(((stats.totalDeposits - stats.totalWithdrawals) / stats.totalDeposits) * 100));
    });

    protected readonly overviewCards = computed(() => [
        {
            label: 'Total Balance',
            value: this.totalBalance(),
            footer: `${this.accounts().length} account surfaces connected`,
            tone: 'teal',
            monetary: true,
        },
        {
            label: 'Monthly Spend',
            value: this.monthlySpend(),
            footer: `${this.transactionStats()?.withdrawalCount ?? 0} debits captured this cycle`,
            tone: 'amber',
            monetary: true,
        },
        {
            label: 'Active Accounts',
            value: this.activeAccounts(),
            footer: `${this.accountStore.summary()?.totalAccounts ?? 0} total accounts across the platform`,
            tone: 'navy',
            monetary: false,
        },
        {
            label: 'Recent Transfers',
            value: this.recentTransfersCount(),
            footer: `${this.inflowVsOutflow()}% net inflow delta this month`,
            tone: 'cyan',
            monetary: false,
        },
    ]);

    protected readonly insightSummary = computed(() => {
        const spend = this.monthlySpend();
        if (spend === 0) {
            return 'No withdrawal activity has been recorded yet. Once transfers begin, Banque will surface spending patterns here.';
        }

        if (this.inflowVsOutflow() > 25) {
            return 'Incoming volume is comfortably ahead of outflow, giving this portfolio room for larger operational transfers.';
        }

        return 'Outflow is accelerating relative to deposits, so the search and receipt flows are useful for audit follow-up.';
    });

    ngOnInit(): void {
        this.authStore.loadUserFromToken();
        this.accountStore.loadAllAccounts();
        this.loadInsights();
    }

    private loadInsights(): void {
        this.isLoading.set(true);

        forkJoin({
            stats: this.transactionApi.getStatistics(),
            recent: this.transactionApi.getRecentTransactions(undefined, 4, {
                page: 0,
                size: 4,
                sort: ['createdAt,desc'],
            }),
        })
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: ({ stats, recent }) => {
                    this.transactionStats.set(stats);
                    this.recentTransactions.set(
                        (recent.content ?? []).map((transaction: TransactionResponse) => ({
                            id: transaction.id,
                            type: transaction.transactionType === 'DEPOSIT' ? 'credit' : 'debit',
                            description: transaction.description || transaction.reference || transaction.transactionType,
                            amount: transaction.amount,
                            date: transaction.createdAt,
                            status: transaction.status,
                        }))
                    );
                },
                error: () => {
                    this.transactionStats.set(null);
                    this.recentTransactions.set([]);
                },
            });
    }
}
