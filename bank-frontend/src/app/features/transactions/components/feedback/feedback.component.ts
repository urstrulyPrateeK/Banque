import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '@core/services/notification.service';
import { FeedbackApiService } from '../../services/feedback-api.service';

@Component({
    selector: 'app-feedback',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './feedback.component.html',
    styleUrl: './feedback.component.css',
})
export class FeedbackComponent {
    private readonly feedbackApi = inject(FeedbackApiService);
    private readonly notificationService = inject(NotificationService);

    readonly transactionId = input.required<number>();
    readonly transactionLabel = input<string>('');

    protected readonly comment = signal('');
    protected readonly selectedSentiment = signal<boolean | null>(null);
    protected readonly isSubmitting = signal(false);
    protected readonly submitted = signal(false);

    protected chooseSentiment(value: boolean): void {
        this.selectedSentiment.set(value);
    }

    protected submit(): void {
        const positive = this.selectedSentiment();
        if (positive === null || this.isSubmitting() || this.submitted()) {
            return;
        }

        this.isSubmitting.set(true);

        this.feedbackApi.submitFeedback({
            transactionId: this.transactionId(),
            positive,
            comment: this.comment().trim() || undefined,
        }).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.submitted.set(true);
                this.notificationService.success(`Feedback saved for ${this.transactionLabel() || 'this transaction'}.`);
            },
            error: () => {
                this.isSubmitting.set(false);
                this.notificationService.error('Unable to save feedback right now.');
            },
        });
    }
}
