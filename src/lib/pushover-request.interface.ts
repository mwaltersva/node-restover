export interface PushoverRequest {
    token: string;
    user: string;
    message: string;
    device?: string;
    title?: string;
    url?: string;
    url_title?: string;
    priority?: number;
    timestamp?: number;
    sound?: string;
}
