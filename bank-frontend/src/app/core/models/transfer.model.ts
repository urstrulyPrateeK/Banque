export interface Transfer {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    transferType: string;
    amount: number;
    currency: string;
    reference: string;
    recipientName: string;
    description: string;
    status: string;
    scheduledDate: string;
    createdAt: string;
}

// Transfer Response Models
export interface TransferResponse {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    transferType: string;
    amount: number;
    currency: string;
    reference: string;
    recipientName: string;
    description: string;
    status: string;
    scheduledDate: string;
    createdAt: string;
}

export interface TransferReceiptResponse {
    transferId: number;
    reference: string;
    transferType: string;
    amount: number;
    currency: string;
    fromAccountNumber: string;
    toAccountNumber: string;
    recipientName: string;
    description: string;
    status: string;
    transferDate: string;
}

export interface TransferStatisticsResponse {
    totalTransfers: number;
    internalTransfers: number;
    externalTransfers: number;
    totalAmount: number;
    completedTransfers: number;
    pendingTransfers: number;
}

export interface TransferLimitsResponse {
    maxInternalTransfer: number;
    maxExternalTransfer: number;
    dailyLimit: number;
}

// Request Models
export interface VerifyAccountRequest {
    accountNumber: string;
}

export interface VerifyAccountResponse {
    isValid: boolean;
    accountNumber: string;
    accountType: string;
    message: string;
}

export interface InternalTransferRequest {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description: string;
}

export interface ExternalTransferRequest {
    fromAccountId: number;
    toAccountNumber: string;
    amount: number;
    recipientName: string;
    description: string;
}

export interface ScheduledTransferRequest {
    fromAccountId: number;
    toAccountId?: number;
    toAccountNumber?: string;
    amount: number;
    scheduledDate: string;
    description?: string;
}

export interface RecurringTransferRequest {
    fromAccountId: number;
    toAccountId?: number;
    toAccountNumber?: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate?: string;
    description?: string;
}

export interface RecurringTransferResponse {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    transferType: string;
    amount: number;
    currency: string;
    frequency: string;
    startDate: string;
    endDate: string;
    nextExecutionDate: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

// Page Response Models
export interface PageTransferResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: TransferResponse[];
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    last: boolean;
    numberOfElements: number;
    pageable: {
        offset: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        paged: boolean;
        pageNumber: number;
        pageSize: number;
        unpaged: boolean;
    };
    empty: boolean;
}

export interface PageRecurringTransferResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: RecurringTransferResponse[];
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    last: boolean;
    numberOfElements: number;
    pageable: {
        offset: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        paged: boolean;
        pageNumber: number;
        pageSize: number;
        unpaged: boolean;
    };
    empty: boolean;
}
