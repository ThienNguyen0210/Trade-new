// Cấu hình chung cho toàn bộ server
// LƯU Ý: Trong môi trường thật, hãy đưa SECRET_KEY vào file .env, đừng hardcode ở đây!
export const SECRET_KEY = process.env.SECRET_KEY || "THIEN_NGUYEN_SECRET_KEY";
export const PORT = process.env.PORT || 5000;