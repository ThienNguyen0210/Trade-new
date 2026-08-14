import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

// Khởi tạo kết nối SQLite + tạo bảng nếu chưa có
export async function initDb() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            balance REAL DEFAULT 10000.0, -- Cho hẳn 10k chơi cho máu
            otp_code TEXT,
            otp_expires_at DATETIME,
            is_verified INTEGER DEFAULT 0
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS trade_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            symbol TEXT,
            type TEXT,          -- 'BUY' hoặc 'SELL'
            price REAL,         -- Giá lúc mua/bán
            amount REAL,        -- Số lượng coin
            total REAL,         -- Tổng USDT (price * amount)
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Lệnh nâng cấp: Thêm các cột coin (Dùng try-catch để tránh lỗi nếu cột đã tồn tại)
    const columns = ['btc_balance', 'eth_balance', 'bnb_balance', 'sol_balance'];
    for (const col of columns) {
        try {
            await db.exec(`ALTER TABLE users ADD COLUMN ${col} REAL DEFAULT 0.0`);
        } catch (e) {
            // Cột đã tồn tại, không sao cả
        }
    }

    console.log("✅ Database đã sẵn sàng: Đã thêm các ví BTC, ETH, BNB, SOL!");
    return db;
}

// Getter để các route file khác lấy db instance đã khởi tạo
export function getDb() {
    if (!db) {
        throw new Error("Database chưa được khởi tạo. Gọi initDb() trước.");
    }
    return db;
}