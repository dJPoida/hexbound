// Server -> Client: Acknowledgement message

// A generic success/acknowledgement message
export interface AckPayload {
    status: 'ok';
    action: string; // e.g., 'game:subscribed'
} 