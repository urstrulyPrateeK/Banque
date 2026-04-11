import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardApiService, GetAllCardsParams } from '../../services/card-api.service';
import { CardResponse, PageCardResponse, Pageable } from '@core/models';

@Component({
    selector: 'app-card-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card-list.component.html',
    styleUrl: './card-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardListComponent implements OnInit {
    private readonly cardApi = inject(CardApiService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly cards = signal<CardResponse[]>([]);
    protected readonly pagination = signal<PageCardResponse | null>(null);
    protected readonly isLoading = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly pageable = signal<Pageable>({ page: 0, size: 10, sort: ['createdAt,desc'] });

    protected readonly totalPages = computed(() => this.pagination()?.totalPages ?? 0);

    ngOnInit(): void {
        this.loadCards();
    }

    protected loadCards(): void {
        this.isLoading.set(true);
        this.error.set(null);

        const params: GetAllCardsParams = {
            pageable: this.pageable(),
        };

        this.cardApi
            .getAllCards(params)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.cards.set(response.content ?? []);
                    this.pagination.set(response);
                    this.isLoading.set(false);
                },
                error: (err: Error) => {
                    this.error.set(err.message || 'Failed to load cards');
                    this.isLoading.set(false);
                },
            });
    }

    protected setPage(page: number): void {
        if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages())) {
            return;
        }
        this.pageable.set({ ...this.pageable(), page });
        this.loadCards();
    }

    protected setPageSize(size: string): void {
        this.pageable.set({ ...this.pageable(), size: Number(size), page: 0 });
        this.loadCards();
    }
}
