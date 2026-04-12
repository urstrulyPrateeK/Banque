import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionStore } from '../../store/transaction.store';
import { FeedbackComponent } from '../feedback/feedback.component';

@Component({
    selector: 'app-transaction-list',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, DatePipe, FeedbackComponent],
    templateUrl: './transaction-list.component.html',
    styleUrls: ['./transaction-list.component.css'],
})
export class TransactionListComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    protected readonly store = inject(TransactionStore);
    protected readonly searchControl = new FormControl('', { nonNullable: true });

    ngOnInit(): void {
        this.store.loadCategories();
        this.store.loadTransactions();

        this.searchControl.valueChanges
            .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.store.setFilter({
                    query: value.trim() || undefined,
                });
            });
    }

    onPageChange(page: number): void {
        this.store.setPage(page);
    }

    onPageSizeChange(size: string): void {
        this.store.setPageSize(Number(size));
    }

    protected trackTransaction(_: number, transaction: { id: number }): number {
        return transaction.id;
    }

    protected asPositive(type: string): boolean {
        return type === 'DEPOSIT';
    }
}
