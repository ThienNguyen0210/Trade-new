// src/OrderModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Info, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderModal({
  isOpen,
  onClose,
  side,
  symbol,
  currentPrice,
  usdtBalance,
  coinBalance,
  onOrderPlaced,
}) {
  const [orderMode, setOrderMode] = useState('MARKET');
  const [inputMode, setInputMode] = useState('COIN'); // 'COIN' hoặc 'USDT'
  const [quantity, setQuantity] = useState(''); // Số lượng Coin
  const [totalUsdt, setTotalUsdt] = useState(''); // Số lượng USDT
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));

  const coinSymbol = symbol.replace('USDT', '');

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setTotalUsdt('');
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [isOpen, currentPrice]);

  if (!isOpen) return null;

  // Tính toán chuyển đổi khi nhập
  const handleInputChange = (value, mode) => {
    const price = orderMode === 'MARKET' ? currentPrice : parseFloat(limitPrice) || 0;
    if (mode === 'COIN') {
      setQuantity(value);
      setTotalUsdt(value ? (parseFloat(value) * price).toFixed(2) : '');
    } else {
      setTotalUsdt(value);
      setQuantity(value && price > 0 ? (parseFloat(value) / price).toFixed(6) : '');
    }
  };

  // Hàm "Tất tay" và các mốc %
  const handlePercentage = (percent) => {
    const price = orderMode === 'MARKET' ? currentPrice : parseFloat(limitPrice) || 0;
    if (price <= 0) return;

    if (side === 'BUY') {
      const amountToSpend = (usdtBalance * percent);
      setTotalUsdt(amountToSpend.toFixed(2));
      setQuantity((amountToSpend / price).toFixed(6));
    } else {
      const amountToSell = (coinBalance * percent);
      setQuantity(amountToSell.toFixed(6));
      setTotalUsdt((amountToSell * price).toFixed(2));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const priceUsed = orderMode === 'MARKET' ? currentPrice : parseFloat(limitPrice);

    if (!qty || qty <= 0) return toast.error('Số lượng không hợp lệ!');
    
    const finalTotal = qty * priceUsed;

    if (side === 'BUY') {
      if (finalTotal > usdtBalance) return toast.error('Số dư USDT không đủ!');
      onOrderPlaced({
        USDT: usdtBalance - finalTotal,
        [coinSymbol]: (coinBalance || 0) + qty,
        type: side,
        price: priceUsed,
        amount: qty
      });
    } else {
      if (qty > coinBalance) return toast.error(`Không đủ ${coinSymbol} để bán!`);
      onOrderPlaced({
        USDT: usdtBalance + finalTotal,
        [coinSymbol]: (coinBalance || 0) - qty,
        type: side,
        price: priceUsed,
        amount: qty
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1e2329] p-6 rounded-2xl border border-[#2b3139] w-[420px] relative shadow-2xl animate-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#848e9c] hover:text-white p-1 rounded-full"><X size={20} /></button>

        <h2 className={`text-xl font-black mb-6 flex items-center gap-2 ${side === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
          <div className={`w-2 h-6 ${side === 'BUY' ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'} rounded-full`}></div>
          {side === 'BUY' ? 'MUA' : 'BÁN'} {coinSymbol}
        </h2>

        {/* Tabs Market / Limit */}
        <div className="flex mb-6 bg-[#0b0e11] p-1 rounded-lg">
          {['MARKET', 'LIMIT'].map((mode) => (
            <button key={mode} className={`flex-1 py-2 text-xs font-bold rounded-md ${orderMode === mode ? 'bg-[#2b3139] text-[#fcd535]' : 'text-[#848e9c]'}`} onClick={() => setOrderMode(mode)}>{mode}</button>
          ))}
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          {/* Input Số lượng / USDT */}
          <div>
            <div className="flex justify-between text-[11px] mb-2">
              <label className="text-[#848e9c] uppercase font-bold flex items-center gap-1 cursor-pointer hover:text-[#fcd535]" onClick={() => setInputMode(inputMode === 'COIN' ? 'USDT' : 'COIN')}>
                Nhập theo {inputMode} <ArrowLeftRight size={12} />
              </label>
              <span className="text-[#848e9c]">Sẵn có: <span className="text-[#eaecef]">{side === 'BUY' ? usdtBalance.toFixed(2) + ' USDT' : (coinBalance || 0).toFixed(6) + ' ' + coinSymbol}</span></span>
            </div>
            
            <div className="relative">
              <input
                type="number"
                value={inputMode === 'COIN' ? quantity : totalUsdt}
                onChange={(e) => handleInputChange(e.target.value, inputMode)}
                placeholder="0.00"
                className="w-full bg-[#0b0e11] p-4 pr-16 rounded-xl text-white font-mono outline-none border border-[#2b3139] focus:border-[#fcd535] text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#848e9c] font-bold text-sm">{inputMode === 'COIN' ? coinSymbol : 'USDT'}</span>
            </div>
          </div>

          {/* Các nút phần trăm (Tất tay) */}
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <button
                key={p}
                onClick={() => handlePercentage(p)}
                className="bg-[#2b3139] hover:bg-[#363d46] text-[#eaecef] py-1.5 rounded-md text-[10px] font-bold transition-colors"
              >
                {p === 1 ? 'TẤT TAY' : (p * 100) + '%'}
              </button>
            ))}
          </div>

          {orderMode === 'LIMIT' && (
            <div>
              <label className="block text-[11px] text-[#848e9c] mb-2 font-bold">GIÁ GIỚI HẠN (USDT)</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => {
                  setLimitPrice(e.target.value);
                  handleInputChange(quantity, 'COIN'); // Cập nhật lại total USDT theo giá mới
                }}
                className="w-full bg-[#0b0e11] p-4 rounded-xl text-white font-mono outline-none border border-[#2b3139] focus:border-[#fcd535]"
              />
            </div>
          )}
        </div>

        {/* Tổng kết */}
        <div className="mt-6 bg-[#2b3139]/30 rounded-xl p-4 border border-white/5">
           <div className="flex justify-between text-xs mb-1 text-[#848e9c]">
              <span>Ước tính nhận:</span>
              <span className="text-white">{inputMode === 'USDT' ? `${quantity} ${coinSymbol}` : `${totalUsdt} USDT`}</span>
           </div>
           <div className="flex justify-between text-sm font-bold">
              <span className="text-[#848e9c]">THANH TOÁN:</span>
              <span className="text-[#fcd535]">{parseFloat(totalUsdt || 0).toLocaleString()} USDT</span>
           </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full mt-6 py-4 rounded-xl font-black text-sm tracking-widest transition-all active:scale-[0.98] ${
            side === 'BUY' ? 'bg-[#0ecb81] hover:bg-[#0eb875] text-[#0b0e11]' : 'bg-[#f6465d] hover:bg-[#e03e55] text-white'
          }`}
        >
          XÁC NHẬN {side === 'BUY' ? 'MUA' : 'BÁN'}
        </button>
      </div>
    </div>
  );
}