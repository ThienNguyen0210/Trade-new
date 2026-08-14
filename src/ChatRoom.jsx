import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';

const ChatRoom = ({ user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  const fetchMessages = async () => {
    const res = await fetch('http://localhost:5000/api/chat', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Check tin nhắn mới mỗi 3s (tạm thời thay socket)
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const handleSend = async (e) => {
  e.preventDefault();
  console.log("Đã nhấn gửi! Nội dung:", input); // Bước 1: Xem hàm có chạy không

  if (!input.trim()) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert("Bạn chưa đăng nhập hoặc mất token!");
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ message: input })
    });

    console.log("Kết quả server:", res.status); // Bước 2: Xem server trả về gì

    if (res.ok) {
      setInput('');
      fetchMessages();
    } else {
      const errorData = await res.json();
      console.error("Lỗi từ server:", errorData);
    }
  } catch (error) {
    console.error("Lỗi kết nối mạng:", error); // Bước 3: Xem có lỗi fetch không
  }
};

return (
  /* Thêm overflow-hidden để cố định khung 320px */
  <div className="fixed right-4 bottom-20 w-80 h-[450px] bg-[#1e2329] border border-[#2b3139] rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-right overflow-hidden">
    
    {/* Header */}
    <div className="p-3 border-b border-[#2b3139] flex justify-between items-center bg-[#161a1e] rounded-t-xl shrink-0">
      <span className="text-sm font-bold text-[#fcd535]">Community</span>
      <X size={18} className="cursor-pointer hover:text-red-500" onClick={onClose} />
    </div>
    
    {/* Body - Nơi hiển thị tin nhắn */}
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 no-scrollbar flex flex-col w-full">
      {messages.map((msg, i) => {
        const isMe = msg.username === user;
        return (
          <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
            {/* Tên hiển thị: Căn theo isMe */}
            <span className={`text-[10px] text-[#848e9c] mb-1 px-1 w-full ${isMe ? 'text-right' : 'text-left'}`}>
              {isMe ? 'Bạn' : msg.username}
            </span>
            
            {/* Bong bóng tin nhắn - Đã sửa lỗi word-break */}
            <div className={`
              px-3 py-2 text-sm shadow-sm max-w-[85%] 
              /* Fix dứt điểm lỗi xuống dòng ở đây */
              break-words 
              [word-break:break-word] 
              whitespace-pre-wrap 
              ${isMe 
                ? 'bg-[#fcd535] text-black rounded-2xl rounded-tr-none' 
                : 'bg-[#2b3139] text-white rounded-2xl rounded-tl-none'}
            `}>
              {msg.message}
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>

    {/* Form gửi tin nhắn */}
    <form onSubmit={handleSend} className="p-3 border-t border-[#2b3139] flex gap-2 bg-[#1e2329] shrink-0">
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Viết gì đó..."
        className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-full px-4 py-1.5 text-xs focus:outline-none focus:border-[#fcd535] text-white min-w-0"
      />
      <button type="submit" className="text-[#fcd535] hover:scale-110 active:scale-95 transition-transform shrink-0">
        <Send size={20}/>
      </button>
    </form>
  </div>
);
};