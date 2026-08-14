import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../config/constants.js';

// Middleware kiểm tra Token JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Vui lòng đăng nhập!" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Phiên đăng nhập hết hạn!" });
        req.user = user; // Lưu thông tin user vào req để dùng ở các route sau
        next(); // Cho phép đi tiếp vào hàm xử lý route
    });
};