import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentApiService, GetAllPaymentsParams } from '../../services/payment-api.service';
import { Pageable, PagePaymentResponse, PaymentResponse } from '@core/models';

@Component({
    selector: 'app-payment-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './payment-list.component.html',
    styleUrl: './payment-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent implements OnInit {
    private readonly paymentApi = inject(PaymentApiService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly payments = signal<PaymentResponse[]>([]);
    protected readonly pagination = signal<PagePaymentResponse | null>(null);
    protected readonly isLoading = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly pageable = signal<Pageable>({ page: 0, size: 10, sort: ['createdAt,desc'] });

    protected readonly totalPages = computed(() => this.pagination()?.totalPages ?? 0);

    ngOnInit(): void {
        this.loadPayments();
    }

    protected loadPayments(): void {
        this.isLoading.set(true);
        this.error.set(null);

        const params: GetAllPaymentsParams = {
            pageable: this.pageable(),
        };

        this.paymentApi
            .getAllPayments(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.payments.set(response.content ?? []);
                    this.pagination.set(response);
                    this.isLoading.set(false);
                },
                error: (err: Error) => {
                    this.error.set(err.message || 'Failed to load payments');
                    this.isLoading.set(false);
                },
            });
    }

    protected setPage(page: number): void {
        if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages())) {
            return;
        }
        this.pageable.set({ ...this.pageable(), page });
        this.loadPayments();
    }

    protected setPageSize(size: string): void {
        this.pageable.set({ ...this.pageable(), size: Number(size), page: 0 });
        this.loadPayments();
    }
}
