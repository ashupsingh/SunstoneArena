import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { registerRealtimeClient, sendRealtimeConnected, unregisterRealtimeClient } from '../config/realtime';

const router = Router();

router.get('/stream', async (req, res) => {
    try {
        const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
        const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined;
        const token = queryToken || bearer;

        if (!token) {
            res.status(401).json({ message: 'Token is required for realtime stream.' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('_id role').lean();

        if (!user) {
            res.status(401).json({ message: 'Invalid user for realtime stream.' });
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const client = registerRealtimeClient(res, String(user._id), String(user.role));
        sendRealtimeConnected(res);

        const keepAlive = setInterval(() => {
            res.write(`event: ping\n`);
            res.write(`data: {\"ts\":${Date.now()}}\n\n`);
        }, 25000);

        req.on('close', () => {
            clearInterval(keepAlive);
            unregisterRealtimeClient(client);
            res.end();
        });
    } catch (_error) {
        res.status(401).json({ message: 'Realtime auth failed.' });
    }
});

export default router;
