import { Component, inject, ChangeDetectionStrategy, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransferStore } from '../../store/transfer.store';
import { AccountStore } from '@features/accounts/store/account.store';
import { NotificationService } from '@core/services';
import {
  ExternalTransferRequest,
  InternalTransferRequest,
  RecurringTransferRequest,
  ScheduledTransferRequest
} from '@core/models';

@Component({
  selector: 'app-transfer-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfer-create.component.html',
  styleUrl: './transfer-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transferStore = inject(TransferStore);
  private readonly accountStore = inject(AccountStore);
  private readonly notificationService = inject(NotificationService);

  protected readonly accounts = this.accountStore.accounts;
  protected readonly isLoading = this.transferStore.isLoading;
  protected readonly error = this.transferStore.error;

  protected transferForm: FormGroup;
  protected fromAccountId: number | null = null;
  protected readonly transferTypes = ['INTERNAL', 'EXTERNAL', 'SCHEDULED', 'RECURRING'] as const;
  private readonly submittedType = signal<string | null>(null);

  constructor() {
    this.transferForm = this.fb.group({
      transferType: ['INTERNAL', Validators.required],
      fromAccountId: ['', Validators.required],
      toAccountId: ['', Validators.required],
      toAccountNumber: [''],
      recipientName: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      scheduledDate: [''],
      frequency: [''],
      startDate: [''],
      endDate: [''],
      description: ['', [Validators.maxLength(200)]]
    });

    effect(() => {
      const lastId = this.transferStore.lastCreatedTransferId();
      const isLoading = this.transferStore.isLoading();
      const error = this.transferStore.error();
      const submittedType = this.submittedType();

      if (!submittedType || !lastId || isLoading || error) {
        return;
      }

      if (submittedType !== 'RECURRING') {
        this.transferStore.clearLastCreatedTransferId();
        this.submittedType.set(null);
        this.router.navigate(['/transfers', lastId, 'receipt']);
        return;
      }

      this.transferForm.reset({
        transferType: 'RECURRING',
        fromAccountId: '',
        toAccountId: '',
        toAccountNumber: '',
        recipientName: '',
        amount: '',
        scheduledDate: '',
        frequency: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      this.transferStore.clearLastCreatedTransferId();
      this.submittedType.set(null);
    });
  }

  ngOnInit(): void {
    // Load all accounts
    this.accountStore.loadAllAccounts();

    // Check if fromAccount is provided in query params
    this.route.queryParams.subscribe(params => {
      const fromAccount = params['fromAccount'];
      if (fromAccount) {
        this.fromAccountId = Number(fromAccount);
        this.transferForm.patchValue({
          fromAccountId: this.fromAccountId
        });
      }
    });

    this.transferForm.get('transferType')?.valueChanges.subscribe((type) => {
      this.updateValidators(type);
    });
    this.updateValidators(this.transferForm.get('transferType')?.value);

  }

  onSubmit(): void {
    if (this.transferForm.valid) {
      const formValue = this.transferForm.value;

      const type = formValue.transferType;
      this.transferStore.clearLastCreatedTransferId();
      this.submittedType.set(type);

      if (type === 'INTERNAL') {
        const transferData: InternalTransferRequest = {
          fromAccountId: Number(formValue.fromAccountId),
          toAccountId: Number(formValue.toAccountId),
          amount: Number(formValue.amount),
          description: formValue.description || ''
        };
        this.transferStore.internalTransfer(transferData);
      } else if (type === 'EXTERNAL') {
        const transferData: ExternalTransferRequest = {
          fromAccountId: Number(formValue.fromAccountId),
          toAccountNumber: String(formValue.toAccountNumber || ''),
          amount: Number(formValue.amount),
          recipientName: String(formValue.recipientName || ''),
          description: formValue.description || ''
        };
        this.transferStore.externalTransfer(transferData);
      } else if (type === 'SCHEDULED') {
        const transferData: ScheduledTransferRequest = {
          fromAccountId: Number(formValue.fromAccountId),
          toAccountId: formValue.toAccountId ? Number(formValue.toAccountId) : undefined,
          toAccountNumber: formValue.toAccountNumber || undefined,
          amount: Number(formValue.amount),
          scheduledDate: String(formValue.scheduledDate || ''),
          description: formValue.description || undefined
        };
        this.transferStore.scheduledTransfer(transferData);
      } else if (type === 'RECURRING') {
        const transferData: RecurringTransferRequest = {
          fromAccountId: Number(formValue.fromAccountId),
          toAccountId: formValue.toAccountId ? Number(formValue.toAccountId) : undefined,
          toAccountNumber: formValue.toAccountNumber || undefined,
          amount: Number(formValue.amount),
          frequency: String(formValue.frequency || ''),
          startDate: String(formValue.startDate || ''),
          endDate: formValue.endDate || undefined,
          description: formValue.description || undefined
        };
        this.transferStore.recurringTransfer(transferData);
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/transfers']);
  }

  get fromAccount() {
    const fromAccountId = Number(this.transferForm.get('fromAccountId')?.value);
    return this.accounts().find(acc => acc.id === fromAccountId);
  }

  get toAccount() {
    const toAccountId = Number(this.transferForm.get('toAccountId')?.value);
    return this.accounts().find(acc => acc.id === toAccountId);
  }

  get canTransfer(): boolean {
    const formValue = this.transferForm.value;
    const fromAccountId = Number(formValue.fromAccountId);
    const toAccountId = Number(formValue.toAccountId);
    const fromAccount = this.accounts().find(acc => acc.id === fromAccountId);
    const toAccount = this.accounts().find(acc => acc.id === toAccountId);
    const type = formValue.transferType;

    if (!fromAccount) {
      return false;
    }

    if (type === 'INTERNAL') {
      return !!(toAccount && fromAccount.id !== toAccount.id);
    }

    if (type === 'EXTERNAL') {
      return !!formValue.toAccountNumber && !!formValue.recipientName;
    }

    if (type === 'SCHEDULED') {
      return !!formValue.scheduledDate && (!!toAccount || !!formValue.toAccountNumber);
    }

    if (type === 'RECURRING') {
      return !!formValue.frequency && !!formValue.startDate && (!!toAccount || !!formValue.toAccountNumber);
    }

    return false;
  }

  private updateValidators(type: string): void {
    const toAccountId = this.transferForm.get('toAccountId');
    const toAccountNumber = this.transferForm.get('toAccountNumber');
    const recipientName = this.transferForm.get('recipientName');
    const scheduledDate = this.transferForm.get('scheduledDate');
    const frequency = this.transferForm.get('frequency');
    const startDate = this.transferForm.get('startDate');
    const endDate = this.transferForm.get('endDate');

    toAccountId?.clearValidators();
    toAccountNumber?.clearValidators();
    recipientName?.clearValidators();
    scheduledDate?.clearValidators();
    frequency?.clearValidators();
    startDate?.clearValidators();
    endDate?.clearValidators();

    if (type === 'INTERNAL') {
      toAccountId?.setValidators([Validators.required]);
    }
    if (type === 'EXTERNAL') {
      toAccountNumber?.setValidators([Validators.required]);
      recipientName?.setValidators([Validators.required, Validators.maxLength(100)]);
    }
    if (type === 'SCHEDULED') {
      scheduledDate?.setValidators([Validators.required]);
    }
    if (type === 'RECURRING') {
      frequency?.setValidators([Validators.required]);
      startDate?.setValidators([Validators.required]);
    }

    toAccountId?.updateValueAndValidity({ emitEvent: false });
    toAccountNumber?.updateValueAndValidity({ emitEvent: false });
    recipientName?.updateValueAndValidity({ emitEvent: false });
    scheduledDate?.updateValueAndValidity({ emitEvent: false });
    frequency?.updateValueAndValidity({ emitEvent: false });
    startDate?.updateValueAndValidity({ emitEvent: false });
    endDate?.updateValueAndValidity({ emitEvent: false });
  }

}
