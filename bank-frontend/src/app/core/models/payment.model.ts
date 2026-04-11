export interface PaymentResponse {
    id: number;
    accountId: number;
    paymentType: string;
    category: string;
    amount: number;
    currency: string;
    reference: string;
    payeeName: string;
    payeeAccount: string;
    description: string;
    status: string;
    scheduledDate: string;
    createdAt: string;
}

export interface PaymentReceiptResponse {
    paymentId: number;
    reference: string;
    paymentType: string;
    category: string;
    amount: number;
    currency: string;
    payeeName: string;
    payeeAccount: string;
    description: string;
    status: string;
    fromAccountNumber: string;
    paymentDate: string;
}

export interface PaymentStatisticsResponse {
    totalPayments: number;
    billPayments: number;
    utilityPayments: number;
    merchantPayments: number;
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
}

export interface PaymentCategoriesResponse {
    categories: string[];
    types: string[];
}

export interface SavedBillerResponse {
    id: number;
    billerName: string;
    category: string;
    accountNumber: string;
    nickname: string;
    createdAt: string;
}

export interface RecurringPaymentResponse {
    id: number;
    accountId: number;
    paymentType: string;
    category: string;
    amount: number;
    currency: string;
    frequency: string;
    startDate: string;
    endDate: string;
    nextExecutionDate: string;
    payeeName: string;
    payeeAccount: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

export interface SchedulePaymentRequest {
    accountId: number;
    paymentType: string;
    category: string;
    payeeName: string;
    payeeAccount?: string;
    amount: number;
    scheduledDate: string;
    description?: string;
}

export interface RecurringPaymentRequest {
    accountId: number;
    paymentType: string;
    category: string;
    payeeName: string;
    payeeAccount?: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate?: string;
    description?: string;
}

export interface UtilityPaymentRequest {
    accountId: number;
    providerName: string;
    utilityType: string;
    meterNumber: string;
    amount: number;
    description?: string;
}

export interface MerchantPaymentRequest {
    accountId: number;
    merchantName: string;
    merchantId: string;
    category: string;
    amount: number;
    description?: string;
}

export interface BillPaymentRequest {
    accountId: number;
    billerName: string;
    category: string;
    accountNumber: string;
    amount: number;
    description?: string;
}

export interface SaveBillerRequest {
    billerName: string;
    category: string;
    accountNumber: string;
    nickname?: string;
}

export interface PagePaymentResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: PaymentResponse[];
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

export interface PageRecurringPaymentResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: RecurringPaymentResponse[];
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

export interface PageSavedBillerResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: SavedBillerResponse[];
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
