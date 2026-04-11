export type AccountType = 'SAVINGS' | 'CHECKING' | 'BUSINESS' | 'LOAN'; // Updated based on statistics response keys
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'CLOSED';

export interface Account {
    id: number;
    accountNumber: string;
    accountType: AccountType;
    balance: number;
    currency: string;
    status: AccountStatus;
    nickname?: string;
    isPrimary: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateAccountRequest {
    accountType: string;
    currency: string;
    nickname?: string;
}

export interface UpdateAccountRequest {
    nickname?: string;
}

export interface AccountSummaryResponse {
    accountId: number;
    accountNumber: string;
    currentBalance: number;
    transactionCount: number;
    totalCredits: number;
    totalDebits: number;
    averageBalance: number;
    currency: string;
}

export interface AllAccountsSummaryResponse {
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    primaryAccountNumber?: string;
    accounts: Account[];
}

export interface AccountStatisticsResponse {
    savingsAccounts: number;
    checkingAccounts: number;
    businessAccounts: number;
    totalBalance: number;
    savingsBalance: number;
    checkingBalance: number;
}

export interface BalanceHistoryResponse {
    id: number;
    oldBalance: number;
    newBalance: number;
    transactionType: string;
    description: string;
    recordedAt: string;
}

export interface PageBalanceHistoryResponse {
    content: BalanceHistoryResponse[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface AccountTypesResponse {
    types: string[];
}

export interface StatementResponse {
    accountNumber: string;
    accountType: string;
    startDate: string; // date format YYYY-MM-DD
    endDate: string; // date format YYYY-MM-DD
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
    totalTransactions: number;
    currency: string;
}

export interface BalanceResponse {
    accountId: number;
    accountNumber: string;
    balance: number;
    currency: string;
    lastUpdated: string; // date-time
}

export interface PageAccountResponse {
    content: Account[];
    totalPages: number;
    totalElements: number;
    numberOfElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface DownloadStatementRequest {
    startDate: string; // date format YYYY-MM-DD
    endDate: string; // date format YYYY-MM-DD
    format: 'pdf' | 'csv' | 'PDF' | 'CSV';
}