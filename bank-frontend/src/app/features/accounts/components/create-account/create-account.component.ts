import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountStore } from '../../store/account.store';
import { AccountApiService } from '../../services/account-api.service';
import { CreateAccountRequest, AccountTypesResponse } from '@core/models';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-create-account',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './create-account.component.html',
    styleUrl: './create-account.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    protected readonly accountStore = inject(AccountStore);
    private readonly accountApi = inject(AccountApiService);

    protected readonly accountTypes = signal<string[]>([]);
    protected readonly isLoadingTypes = signal(false);

    protected readonly createAccountForm = this.fb.nonNullable.group({
        accountType: ['', [Validators.required]],
        currency: ['USD', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
        nickname: ['', [Validators.maxLength(50)]],
    });

    protected readonly isSubmitting = computed(() => this.accountStore.isLoading());
    private readonly hasCreatedAccount = signal(false);

    constructor() {
        // Navigate to account list after successful creation
        effect(() => {
            const isLoading = this.accountStore.isLoading();
            const error = this.accountStore.error();
            const accounts = this.accountStore.accounts();
            
            // If we submitted and loading finished without error, and we have a new account
            if (this.hasCreatedAccount() && !isLoading && !error && accounts.length > 0) {
                // Small delay to show success message
                setTimeout(() => {
                    this.router.navigate(['/accounts']);
                }, 500);
                this.hasCreatedAccount.set(false);
            }
        });
    }

    ngOnInit(): void {
        this.loadAccountTypes();
    }

    private loadAccountTypes(): void {
        this.isLoadingTypes.set(true);
        this.accountApi.getAccountTypes().pipe(
            catchError(err => {
                console.error('Failed to load account types:', err);
                // Default account types if API fails
                this.accountTypes.set(['SAVINGS', 'CHECKING', 'BUSINESS']);
                return of(null);
            })
        ).subscribe(response => {
            this.isLoadingTypes.set(false);
            if (response?.types && response.types.length > 0) {
                this.accountTypes.set(response.types);
            } else {
                // Fallback to default types
                this.accountTypes.set(['SAVINGS', 'CHECKING', 'BUSINESS']);
            }
        });
    }

    protected getAccountTypeIcon(type: string): string {
        switch (type.toUpperCase()) {
            case 'SAVINGS':
                return '💰';
            case 'CHECKING':
                return '💳';
            case 'BUSINESS':
                return '🏢';
            default:
                return '🏦';
        }
    }

    protected getFieldError(fieldName: 'accountType' | 'currency' | 'nickname'): string | null {
        const control = this.createAccountForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) {
                return `${fieldName === 'accountType' ? 'Account type' : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
            }
            if (control.errors['minlength'] || control.errors['maxlength']) {
                if (fieldName === 'currency') {
                    return 'Currency must be exactly 3 characters (e.g., USD, EUR)';
                }
                if (fieldName === 'nickname') {
                    return 'Nickname must be 50 characters or less';
                }
            }
        }
        return null;
    }

    protected onSubmit(): void {
        if (this.createAccountForm.valid) {
            const formValue = this.createAccountForm.getRawValue();
            const request: CreateAccountRequest = {
                accountType: formValue.accountType,
                currency: formValue.currency.toUpperCase(),
                nickname: formValue.nickname || undefined,
            };

            this.hasCreatedAccount.set(true);
            this.accountStore.createAccount(request);
        } else {
            this.createAccountForm.markAllAsTouched();
        }
    }

    protected onCancel(): void {
        this.router.navigate(['/accounts']);
    }
}
