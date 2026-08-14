import express from 'express';
import { getDb } from '../config/db.js';

const router = express.Router();

// API Lấy tin nhắn (GET)
router.get('/', async (req, res) => {
    const db = getDb();
    try {
        const messages = await db.all(
            'SELECT username, message, timestamp FROM chat_messages ORDER BY timestamp ASC LIMIT 50'
        );
        res.json(messages);
    } catch (err) {
        console.error("Lỗi GET chat:", err);
        res.status(500).json({ error: "Không thể lấy tin nhắn" });
    }
});

// Route POST - Gửi tin nhắn (Tạm thời bỏ authenticateToken để test cho dễ)
router.post('/', async (req, res) => {
    const db = getDb();
    try {
        const { message, username } = req.body;
        const name = username || "Ẩn danh";

        if (!message) return res.status(400).json({ error: "Tin nhắn trống" });

        await db.run(
            'INSERT INTO chat_messages (username, message) VALUES (?, ?)',
            [name, message]
        );

        res.status(201).json({ success: true, username: name, message: message });
    } catch (err) {
        console.error("Lỗi POST chat vào SQLite:", err);
        res.status(500).json({ error: "Lỗi không lưu được tin nhắn vào SQLite" });
    }
});

export default router;