import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TransferStore } from '../../store/transfer.store';

@Component({
    selector: 'app-transfer-receipt',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './transfer-receipt.component.html',
    styleUrl: './transfer-receipt.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferReceiptComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    protected readonly transferStore = inject(TransferStore);
    protected readonly localError = signal<string | null>(null);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id || Number.isNaN(id) || id <= 0) {
            this.localError.set('Invalid transfer ID');
            return;
        }

        this.transferStore.getReceipt(id);
    }

    ngOnDestroy(): void {
        this.transferStore.clearReceipt();
    }
}
