import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import { SECRET_KEY } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- API LẤY THÔNG TIN VÍ (BALANCE) ---
router.get('/balance', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Chưa đăng nhập" });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const db = getDb();

        // 1. Lấy tất cả các cột coin
        const user = await db.get(
            'SELECT balance, btc_balance, eth_balance, bnb_balance, sol_balance FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user) return res.status(404).json({ error: "User không tồn tại" });

        // 2. Ép kiểu số cho tất cả các tài sản để tránh lỗi string ở Frontend
        const assets = {
            USDT: parseFloat(user.balance || 0),
            BTC: parseFloat(user.btc_balance || 0),
            ETH: parseFloat(user.eth_balance || 0),
            BNB: parseFloat(user.bnb_balance || 0),
            SOL: parseFloat(user.sol_balance || 0)
        };

        // 3. Trả về object chứa toàn bộ ví tiền
        res.json(assets);

        console.log(`💰 Đã gửi số dư cho ${decoded.username}:`, assets);
    } catch (e) {
        res.status(401).json({ error: "Token hết hạn hoặc không hợp lệ" });
    }
});

// --- API CẬP NHẬT TÀI SẢN SAU GIAO DỊCH ---
router.post('/update-assets', authenticateToken, async (req, res) => {
    const { newUSDT, coin, newCoinQty, type, price, amount } = req.body;
    const userId = req.user.id;
    const symbol = `${coin}USDT`;
    const db = getDb();

    console.log(`--- Giao dịch mới trên ThienNguyen EX ---`);
    console.log(`${type} ${amount} ${coin} tại giá ${price}`);

    if (newUSDT === undefined || !coin || !type || !price || !amount) {
        return res.status(400).json({ error: "Thiếu thông tin giao dịch" });
    }

    const coinColumn = `${coin.toLowerCase()}_balance`;

    try {
        // Bắt đầu giao dịch (Transaction) để đảm bảo an toàn dữ liệu
        await db.run('BEGIN TRANSACTION');

        // 1. Cập nhật số dư ví (Balance & Coin)
        await db.run(
            `UPDATE users SET balance = ?, ${coinColumn} = ? WHERE id = ?`,
            [parseFloat(newUSDT), parseFloat(newCoinQty), userId]
        );

        // 2. Ghi chép vào bảng lịch sử trade_history
        await db.run(
            `INSERT INTO trade_history (user_id, symbol, type, price, amount, total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, symbol, type, parseFloat(price), parseFloat(amount), parseFloat(price * amount)]
        );

        await db.run('COMMIT');

        console.log("✅ Giao dịch thành công và đã ghi sổ cái!");
        res.json({ success: true, message: "Giao dịch đã được lưu vĩnh viễn!" });

    } catch (err) {
        // Nếu có lỗi, hủy bỏ toàn bộ các bước trên (không trừ tiền bừa bãi)
        await db.run('ROLLBACK');
        console.error("❌ Lỗi Giao dịch:", err);
        res.status(500).json({ error: "Lỗi hệ thống, giao dịch đã bị hủy để bảo vệ tiền của bạn" });
    }
});

// --- API LẤY LỊCH SỬ GIAO DỊCH ---
router.get('/trade-history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const db = getDb();

    try {
        const history = await db.all(
            `SELECT id, symbol, type, price, amount, total, timestamp
             FROM trade_history
             WHERE user_id = ?
             ORDER BY timestamp DESC LIMIT 50`,
            [userId]
        );

        res.json(history);

        console.log(`📜 Đã gửi lịch sử giao dịch cho User ID: ${userId}`);
    } catch (err) {
        console.error("❌ Lỗi lấy lịch sử:", err);
        res.status(500).json({ error: "Không thể lấy dữ liệu lịch sử" });
    }
});

export default router;