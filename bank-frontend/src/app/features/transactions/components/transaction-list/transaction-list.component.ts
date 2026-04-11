import { Component, OnInit, inject } from '@angular/core';
import { TransactionStore } from '../../store/transaction.store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css'],
})
export class TransactionListComponent implements OnInit {
  protected readonly store = inject(TransactionStore);

  ngOnInit(): void {
    this.store.loadTransactions();
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: string): void {
    this.store.setPageSize(Number(size));
  }
}
