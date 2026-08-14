import express from 'express';
import cors from 'cors';
import { initDb } from './config/db.js';
import { PORT } from './config/constants.js';

import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import chatRoutes from './routes/chat.js';

const app = express();
app.use(express.json());
app.use(cors());

// Gắn các nhóm route vào app
app.use('/api', authRoutes);       // /api/register, /api/login, /api/verify-otp, /api/verify-success
app.use('/api', walletRoutes);     // /api/balance, /api/update-assets, /api/trade-history
app.use('/api/chat', chatRoutes);  // /api/chat (GET/POST)

initDb()
    .then(() => {
        app.listen(PORT, () => console.log(`🚀 ThienNguyen Backend tại http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("❌ Không thể khởi tạo database:", err);
        process.exit(1);
    });