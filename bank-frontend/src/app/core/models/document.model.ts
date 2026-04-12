export type DocumentType = 'KYC' | 'PROFILE_PHOTO' | 'ADDRESS_PROOF';

export interface DocumentUploadResponse {
    id: number;
    userId: number;
    documentType: string;
    originalFileName: string;
    storageProvider: string;
    accessUrl: string;
    uploadedAt: string;
}

export interface DocumentAccessResponse {
    id: number;
    userId: number;
    documentType: string;
    originalFileName: string;
    contentType: string;
    storageProvider: string;
    accessUrl: string;
    uploadedAt: string;
}
