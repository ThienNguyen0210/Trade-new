import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ShieldCheck, Mail, Smartphone, ArrowLeft, X } from 'lucide-react';
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

export default function Auth({ onLoginSuccess, onClose }) {
  // States quản lý luồng: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login'); 
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // States cho OTP
  const [serverOtp, setServerOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Countdown cho OTP (5 phút)
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && mode === 'verify') {
      setMsg({ text: 'Mã OTP đã hết hạn (5 phút)!', type: 'error' });
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, mode]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMsg({ text: 'Mật khẩu không khớp!', type: 'error' });
      return;
    }
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const regRes = await fetch(`http://localhost:5000/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await emailjs.send(
        "service_7y26eqp",
        "template_mcvqowq",
        {
          user_email: form.email,
          to_name: form.username,
          message: `Mã xác thực ThienNguyen Ex của bạn là: ${otp}. Hiệu lực trong 5 phút.`,
        },
        "BUHtg1BuVtAPT9O2M"
      );

      setServerOtp(otp);
      setTimeLeft(300); 
      setMode('verify');
      setMsg({ text: 'Đã gửi mã OTP về email!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setMsg({ text: 'Mã đã hết hạn, vui lòng gửi lại mã mới!', type: 'error' });
      return;
    }
    if (form.otp !== serverOtp) {
      setMsg({ text: 'Mã OTP không chính xác!', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/verify-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      if (!res.ok) throw new Error("Xác thực thất bại trên server");

      Swal.fire({ 
        icon: 'success', 
        title: 'Thành công!', 
        text: 'Tài khoản đã được kích hoạt, mời bạn đăng nhập.',
        background: '#1e2329',
        color: '#fff',
        confirmButtonColor: '#fcd535'
      });

      setMode('login');
      setForm({ ...form, otp: '', password: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      onLoginSuccess(data.username, data.balance);
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[92vw] sm:w-[400px] bg-[#1e2329] p-6 sm:p-8 rounded-2xl border border-[#2b3139] shadow-2xl relative animate-in zoom-in-95 duration-200">
      
      {/* Header Luân chuyển */}
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-[#fcd535]/10 rounded-full mb-3">
          {mode === 'login' && <ShieldCheck size={32} className="text-[#fcd535]" />}
          {mode === 'register' && <Mail size={32} className="text-[#fcd535]" />}
          {mode === 'verify' && <Smartphone size={32} className="text-[#fcd535]" />}
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký tài khoản' : 'Xác thực OTP'}
        </h2>
        <p className="text-[10px] text-[#848e9c] uppercase tracking-widest mt-1">ThienNguyen Exchange</p>
      </div>

      {/* FORM LOGIC */}
      <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleSendOTP : handleVerifyAndRegister} className="space-y-4">
        
        {mode !== 'verify' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#848e9c] ml-1">Tên đăng nhập</label>
            <input 
              className="w-full bg-[#2b3139] p-3.5 rounded-xl text-sm text-white outline-none border border-transparent focus:border-[#fcd535] transition-all"
              placeholder="Nhập username..."
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              required
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2">
            <label className="text-xs font-bold text-[#848e9c] ml-1">Email nhận mã</label>
            <input 
              type="email"
              className="w-full bg-[#2b3139] p-3.5 rounded-xl text-sm text-white outline-none border border-transparent focus:border-[#fcd535] transition-all"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
        )}

        {mode !== 'verify' && (
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-[#848e9c] ml-1">Mật khẩu</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#2b3139] p-3.5 rounded-xl text-sm text-white outline-none border border-transparent focus:border-[#fcd535] transition-all"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-[#fcd535]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-left-4">
            <label className="text-xs font-bold text-[#848e9c] ml-1">Xác nhận mật khẩu</label>
            <input 
              type="password"
              className="w-full bg-[#2b3139] p-3.5 rounded-xl text-sm text-white outline-none border border-transparent focus:border-[#fcd535] transition-all"
              placeholder="Nhập lại mật khẩu..."
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              required
            />
          </div>
        )}

        {mode === 'verify' && (
          <div className="space-y-4 text-center animate-in zoom-in-90">
            <p className="text-xs text-[#848e9c]">Mã 6 số đã gửi đến <b className="text-white">{form.email}</b></p>
            <input 
              maxLength={6}
              className="w-full bg-[#2b3139] text-center text-3xl tracking-[8px] font-black p-4 rounded-xl text-[#fcd535] outline-none border-2 border-[#fcd535]/50 focus:border-[#fcd535] transition-all"
              value={form.otp}
              onChange={e => setForm({...form, otp: e.target.value})}
              placeholder="000000"
              required
            />
            <div className={`text-xs font-bold ${timeLeft > 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {timeLeft > 0 ? `Hiệu lực còn: ${timeLeft} giây` : 'Mã đã hết hạn!'}
            </div>
            {timeLeft === 0 && (
              <button type="button" onClick={handleSendOTP} className="text-[#fcd535] text-xs font-bold underline hover:text-white transition-colors">Gửi lại mã mới</button>
            )}
          </div>
        )}

        {msg.text && (
          <div className={`text-[11px] font-bold p-3 rounded-xl text-center animate-in shake-1 ${msg.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-[#0ecb81] border border-[#0ecb81]/20'}`}>
            {msg.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 bg-[#fcd535] hover:bg-[#f0c82d] disabled:bg-[#fcd535]/50 text-black rounded-xl font-black text-sm transition-all transform active:scale-[0.98] shadow-lg shadow-[#fcd535]/10"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ĐANG XỬ LÝ...
            </div>
          ) : (
            mode === 'login' ? 'ĐĂNG NHẬP NGAY' : mode === 'register' ? 'NHẬN MÃ XÁC THỰC' : 'KÍCH HOẠT TÀI KHOẢN'
          )}
        </button>
      </form>

      {/* Chuyển đổi Mode */}
      <div className="mt-8 text-center">
        {mode === 'verify' ? (
          <button onClick={() => setMode('register')} className="flex items-center gap-2 mx-auto text-xs font-bold text-[#848e9c] hover:text-white transition-colors">
            <ArrowLeft size={14} /> QUAY LẠI ĐĂNG KÝ
          </button>
        ) : (
          <p className="text-xs text-[#848e9c] font-medium">
            {mode === 'login' ? 'Chưa có tài khoản ThienNguyen?' : 'Đã có tài khoản rồi?'}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setMsg({ text: '', type: '' });
              }} 
              className="text-[#fcd535] ml-2 font-black hover:underline underline-offset-4"
            >
              {mode === 'login' ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}