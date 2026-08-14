import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import { SECRET_KEY } from '../config/constants.js';

const router = express.Router();

// --- API ĐĂNG KÝ (Gửi OTP giả định) ---
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const db = getDb();

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Thiếu thông tin" });
    }

    try {
        const existing = await db.get(
            'SELECT 1 FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (existing) {
            return res.status(400).json({ error: "Tên đăng nhập hoặc email đã được sử dụng" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 phút

        await db.run(
            `INSERT INTO users (username, email, password, otp_code, otp_expires_at, is_verified)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [username, email, hashedPassword, otp, expiresAt]
        );

        // Gửi email OTP ở đây (dùng emailjs hoặc nodemailer)
        // Ví dụ: await sendEmail(email, otp);

        res.status(201).json({
            message: "Đăng ký thành công! Mã OTP đã được gửi đến email của bạn.",
            emailSentTo: email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// --- API XÁC THỰC OTP (Cập nhật để kích hoạt tài khoản) ---
router.post('/verify-success', async (req, res) => {
    const { email } = req.body;
    const db = getDb();
    try {
        // Sau khi Frontend khớp OTP, gọi API này để chuyển trạng thái thành 1 (Đã xác thực)
        await db.run('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);
        res.json({ message: "Tài khoản đã được kích hoạt thành công!" });
    } catch (e) {
        res.status(500).json({ error: "Không thể kích hoạt tài khoản" });
    }
});

// --- API XÁC THỰC OTP ---
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const db = getDb();

    try {
        const user = await db.get(
            'SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires_at > datetime("now")',
            [email, otp]
        );

        if (!user) {
            return res.status(400).json({ error: "Mã OTP không đúng hoặc đã hết hạn" });
        }

        await db.run(
            'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        res.json({ message: "Xác thực thành công! Bạn có thể đăng nhập ngay." });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server" });
    }
});

// --- API ĐĂNG NHẬP ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = getDb();
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }

        if (user.is_verified === 0) {
            return res.status(403).json({ error: "Tài khoản chưa xác thực OTP!" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({
            token,
            username: user.username,
            email: user.email,
            balance: user.balance
        });
    } catch (e) {
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});

export default router;