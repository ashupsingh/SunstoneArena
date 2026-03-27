import axios from 'axios';

const PROD_API_BASE_URL = 'https://arena-api-lovat.vercel.app/api';

const resolveApiBaseUrl = (): string => {
    const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();

    if (typeof window !== 'undefined') {
        const isHostedOnVercel = window.location.hostname.includes('vercel.app');
        const pointsToLocalhost = configured.includes('localhost') || configured.includes('127.0.0.1');

        if (isHostedOnVercel && (!configured || pointsToLocalhost)) {
            return PROD_API_BASE_URL;
        }
    }

    return configured || 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
});

export const getRealtimeStreamUrl = (token: string): string => {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    if (base.startsWith('http://') || base.startsWith('https://')) {
        return `${base}/realtime/stream?token=${encodeURIComponent(token)}`;
    }

    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        return `${origin}${base || '/api'}/realtime/stream?token=${encodeURIComponent(token)}`;
    }

    return `/api/realtime/stream?token=${encodeURIComponent(token)}`;
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
