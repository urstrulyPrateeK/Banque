import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransferStore } from '../../store/transfer.store';
import { RouterLink } from '@angular/router';
import { TransferResponse, RecurringTransferResponse } from '@core/models';

type TransferView = 'all' | 'pending' | 'scheduled' | 'recurring';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transfer-list.component.html',
  styleUrl: './transfer-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferListComponent implements OnInit {
  protected readonly transferStore = inject(TransferStore);
  protected readonly view = signal<TransferView>('all');
  protected readonly verifyAccountNumber = signal('');

  protected readonly isRecurringView = computed(() => this.view() === 'recurring');

  protected readonly nonRecurringTransfers = computed<TransferResponse[]>(() => {
    switch (this.view()) {
      case 'pending':
        return this.transferStore.pendingTransfers() as TransferResponse[];
      case 'scheduled':
        return this.transferStore.scheduledTransfers();
      default:
        return this.transferStore.transfers() as TransferResponse[];
    }
  });

  protected readonly recurringTransfers = computed<RecurringTransferResponse[]>(() => {
    return this.transferStore.recurringTransfers();
  });

  protected readonly currentPagination = computed(() => {
    switch (this.view()) {
      case 'pending':
        return this.transferStore.pendingPagination();
      case 'scheduled':
        return this.transferStore.scheduledPagination();
      case 'recurring':
        return this.transferStore.recurringPagination();
      default:
        return this.transferStore.pagination();
    }
  });

  protected readonly totalPages = computed(() => this.currentPagination()?.totalPages ?? 0);

  ngOnInit(): void {
    this.loadCurrent();
  }

  protected setView(view: TransferView): void {
    this.view.set(view);
    this.loadCurrent();
  }

  protected loadCurrent(): void {
    const pageable = this.transferStore.pageable();
    switch (this.view()) {
      case 'pending':
        this.transferStore.loadPendingTransfers(pageable);
        break;
      case 'scheduled':
        this.transferStore.loadScheduledTransfers(pageable);
        break;
      case 'recurring':
        this.transferStore.loadRecurringTransfers(pageable);
        break;
      default:
        this.transferStore.loadTransfers();
        break;
    }
  }

  protected setPage(page: number): void {
    const pageable = { ...this.transferStore.pageable(), page };
    switch (this.view()) {
      case 'pending':
        this.transferStore.loadPendingTransfers(pageable);
        break;
      case 'scheduled':
        this.transferStore.loadScheduledTransfers(pageable);
        break;
      case 'recurring':
        this.transferStore.loadRecurringTransfers(pageable);
        break;
      default:
        this.transferStore.setPage(page);
        break;
    }
  }

  protected loadStatistics(): void {
    this.transferStore.loadStatistics({});
  }

  protected loadLimits(): void {
    this.transferStore.loadLimits();
  }

  protected verifyAccount(): void {
    const accountNumber = this.verifyAccountNumber().trim();
    if (!accountNumber) {
      return;
    }
    this.transferStore.verifyAccount({ accountNumber });
  }
}
