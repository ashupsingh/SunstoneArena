import { Response } from 'express';

type RealtimeClient = {
    res: Response;
    userId: string;
    role: string;
};

const clients = new Set<RealtimeClient>();

export const registerRealtimeClient = (res: Response, userId: string, role: string): RealtimeClient => {
    const client: RealtimeClient = { res, userId, role };
    clients.add(client);
    return client;
};

export const unregisterRealtimeClient = (client: RealtimeClient): void => {
    clients.delete(client);
};

export const broadcastRealtimeSync = (reason: string): void => {
    const payload = JSON.stringify({
        type: 'sync',
        reason,
        ts: Date.now(),
    });

    for (const client of clients) {
        try {
            client.res.write(`event: sync\n`);
            client.res.write(`data: ${payload}\n\n`);
        } catch (_error) {
            clients.delete(client);
        }
    }
};

export const sendRealtimeConnected = (res: Response): void => {
    const payload = JSON.stringify({ type: 'connected', ts: Date.now() });
    res.write(`event: connected\n`);
    res.write(`data: ${payload}\n\n`);
};
