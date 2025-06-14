export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata: any;
    requestId: string | null;
    transactionId: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    expiresAt: string | null;
    priority: string;
}
