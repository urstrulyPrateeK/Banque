export interface Transaction {
    id: number;
    accountId: number;
    transactionType: string;
    amount: number;
    currency: string;
    reference: string;
    description: string;
    status: string;
    createdAt: string;
}

// Transaction Response Models
export interface TransactionResponse {
    id: number;
    accountId: number;
    transactionType: string;
    amount: number;
    currency: string;
    reference: string;
    description: string;
    status: string;
    createdAt: string;
}

export interface TransactionReceiptResponse {
    transactionId: number;
    reference: string;
    transactionType: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    accountNumber: string;
    accountType: string;
    transactionDate: string;
}

export interface TransactionStatisticsResponse {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    depositCount: number;
    withdrawalCount: number;
    pendingCount: number;
    failedCount: number;
}

export interface TransactionCategoriesResponse {
    types: string[];
    statuses: string[];
}

export interface PageTransactionResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: TransactionResponse[];
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

// Request Models
export interface DepositRequest {
    accountId: number;
    amount: number;
    description: string;
}

export interface WithdrawRequest {
    accountId: number;
    amount: number;
    description: string;
}

export interface RaiseDisputeRequest {
    reason: string;
}

export interface SearchTransactionRequest {
    accountId?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface ExportTransactionsRequest {
    startDate: string;
    endDate: string;
    format: string;
    accountId?: number;
}
