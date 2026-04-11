export interface CardResponse {
    id: number;
    accountId: number;
    cardType: string;
    maskedCardNumber: string;
    cardholderName: string;
    expiryDate: string;
    status: string;
    createdAt: string;
}

export interface CardDetailsResponse {
    id: number;
    maskedCardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cardType: string;
    status: string;
    onlineTransactionsEnabled: boolean;
    contactlessEnabled: boolean;
    internationalEnabled: boolean;
}

export interface CardTransactionResponse {
    id: number;
    merchantName: string;
    transactionType: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

export interface CardStatementResponse {
    last4Digits: string;
    cardType: string;
    startDate: string;
    endDate: string;
    totalSpent: number;
    transactionCount: number;
    currency: string;
}

export interface CardLimitsResponse {
    dailyLimit: number;
    monthlyLimit: number;
    atmLimit: number;
    posLimit: number;
}

export interface CardStatisticsResponse {
    totalCards: number;
    activeCards: number;
    blockedCards: number;
    debitCards: number;
    creditCards: number;
}

export interface CardTypesResponse {
    types: string[];
}

export interface CardRequestRequest {
    accountId: number;
    cardType: string;
}

export interface ActivateCardRequest {
    cvv: string;
    pin: string;
}

export interface ChangePinRequest {
    currentPin: string;
    newPin: string;
    confirmPin: string;
}

export interface SetCardLimitsRequest {
    dailyLimit: number;
    monthlyLimit: number;
    atmLimit: number;
    posLimit: number;
}

export interface PageCardResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: CardResponse[];
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

export interface PageCardTransactionResponse {
    totalElements: number;
    totalPages: number;
    size: number;
    content: CardTransactionResponse[];
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
