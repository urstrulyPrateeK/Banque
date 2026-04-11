import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentApiService } from '../../services/payment-api.service';
import { PaymentReceiptResponse } from '@core/models';

@Component({
    selector: 'app-payment-receipt',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './payment-receipt.component.html',
    styleUrl: './payment-receipt.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentReceiptComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly paymentApi = inject(PaymentApiService);

    protected readonly receipt = signal<PaymentReceiptResponse | null>(null);
    protected readonly isLoading = signal(false);
    protected readonly error = signal<string | null>(null);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id || Number.isNaN(id) || id <= 0) {
            this.error.set('Invalid payment ID');
            return;
        }

        this.isLoading.set(true);
        this.paymentApi.getReceipt(id).subscribe({
            next: (receipt) => {
                this.receipt.set(receipt);
                this.isLoading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message || 'Failed to load receipt');
                this.isLoading.set(false);
            },
        });
    }

    ngOnDestroy(): void {
        this.receipt.set(null);
    }
}
