export interface FeedbackRequest {
    transactionId: number;
    positive: boolean;
    comment?: string;
}
