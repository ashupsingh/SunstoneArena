import User from '../models/User';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const isValidExpoToken = (token: string): boolean => {
    return /^Expo(nent)?PushToken\[.+\]$/.test(token);
};

const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

export const sendPushToUsers = async (
    userIds: Array<string | { toString(): string }>,
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<{ delivered: number; attempted: number }> => {
    if (userIds.length === 0) {
        return { delivered: 0, attempted: 0 };
    }

    const ids = [...new Set(userIds.map((id) => id.toString()))];
    const users = await User.find({ _id: { $in: ids } }).select('expoPushTokens');

    const tokens = [...new Set(users.flatMap((u) => u.expoPushTokens || []))].filter(isValidExpoToken);
    if (tokens.length === 0) {
        return { delivered: 0, attempted: 0 };
    }

    let delivered = 0;
    const batches = chunk(tokens, 100);

    for (const batch of batches) {
        const messages = batch.map((to) => ({
            to,
            sound: 'default',
            title,
            body,
            data: data || {},
            priority: 'high',
        }));

        try {
            const response = await fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const result = await response.json() as { data?: Array<{ status?: string }> };
            const okCount = (result.data || []).filter((ticket) => ticket.status === 'ok').length;
            delivered += okCount;
        } catch (error) {
            console.error('Push dispatch error:', error);
        }
    }

    return { delivered, attempted: tokens.length };
};
