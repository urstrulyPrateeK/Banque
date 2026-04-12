import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@features/auth/store/auth.store';
import { NotificationService } from '@core/services/notification.service';
import { DocumentAccessResponse, DocumentType, DocumentUploadResponse } from '@core/models';
import { DocumentApiService } from '../../services/document-api.service';

interface DocumentTypeOption {
    value: DocumentType;
    label: string;
    helper: string;
}

@Component({
    selector: 'app-document-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './document-upload.component.html',
    styleUrl: './document-upload.component.css',
})
export class DocumentUploadComponent {
    private readonly authStore = inject(AuthStore);
    private readonly documentApi = inject(DocumentApiService);
    private readonly notificationService = inject(NotificationService);

    protected readonly dragActive = signal(false);
    protected readonly isUploading = signal(false);
    protected readonly errorMessage = signal('');
    protected readonly selectedType = signal<DocumentType>('KYC');
    protected readonly latestDocument = signal<DocumentAccessResponse | null>(null);
    protected readonly lastUpload = signal<DocumentUploadResponse | null>(null);

    protected readonly documentTypes: DocumentTypeOption[] = [
        {
            value: 'KYC',
            label: 'KYC package',
            helper: 'Identity verification for onboarding and periodic reviews.',
        },
        {
            value: 'PROFILE_PHOTO',
            label: 'Profile photo',
            helper: 'Secure profile imagery stored in Banque document storage.',
        },
        {
            value: 'ADDRESS_PROOF',
            label: 'Address proof',
            helper: 'Utility bill or tax record for compliance validation.',
        },
    ];

    protected readonly currentUserId = computed(() => this.authStore.user()?.id ?? null);

    constructor() {
        effect(() => {
            const userId = this.currentUserId();
            if (userId) {
                this.loadLatestKycDocument(userId);
            }
        });
    }

    protected onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragActive.set(true);
    }

    protected onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.dragActive.set(false);
    }

    protected onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragActive.set(false);
        const file = event.dataTransfer?.files?.item(0);
        if (file) {
            this.uploadDocument(file);
        }
    }

    protected onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.item(0);
        if (file) {
            this.uploadDocument(file);
            if (input) {
                input.value = '';
            }
        }
    }

    protected trackType(_: number, option: DocumentTypeOption): DocumentType {
        return option.value;
    }

    private uploadDocument(file: File): void {
        if (!this.isSupportedFile(file)) {
            this.errorMessage.set('Upload a PDF, PNG, or JPG under 10 MB.');
            return;
        }

        this.errorMessage.set('');
        this.isUploading.set(true);

        this.documentApi.uploadDocument(file, this.selectedType()).subscribe({
            next: (response) => {
                this.lastUpload.set(response);
                this.isUploading.set(false);
                this.notificationService.success(`${file.name} uploaded securely to Banque storage.`);
                if (response.documentType === 'KYC' && response.userId) {
                    this.loadLatestKycDocument(response.userId);
                }
            },
            error: (error) => {
                this.isUploading.set(false);
                this.errorMessage.set(error?.error?.detail ?? 'Unable to upload this document right now.');
                this.notificationService.error('Document upload failed');
            },
        });
    }

    private loadLatestKycDocument(userId: number): void {
        this.documentApi.getLatestKycDocument(userId).subscribe({
            next: (document) => this.latestDocument.set(document),
            error: () => this.latestDocument.set(null),
        });
    }

    private isSupportedFile(file: File): boolean {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    }
}
