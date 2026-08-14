import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

const TradeHistory = ({ onClose, currentPrices }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/trade-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHistory(await res.json());
    };
    fetchHistory();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#1e2329] border border-[#2b3139] rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#2b3139] flex justify-between items-center bg-[#161a1e]">
          <h2 className="text-lg font-bold text-[#fcd535] flex items-center gap-2">
            <History size={20} /> LỊCH SỬ GIAO DỊCH & PNL
          </h2>
          <button onClick={onClose} className="hover:text-red-500 transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-[#848e9c] border-b border-[#2b3139]">
              <tr>
                <th className="pb-3">Thời gian</th>
                <th className="pb-3">Cặp tiền</th>
                <th className="pb-3">Loại</th>
                <th className="pb-3 text-right">Giá khớp</th>
                <th className="pb-3 text-right">Số lượng</th>
                <th className="pb-3 text-right">Tổng (USDT)</th>
                <th className="pb-3 text-right">Lời / Lỗ (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3139]">
              {history.map((item) => {
                const curPrice = currentPrices[item.symbol] || item.price;
                // Tính % lời lỗ: (Giá hiện tại - Giá mua) / Giá mua * 100
                const pnl = item.type === 'BUY' 
                  ? ((curPrice - item.price) / item.price) * 100 
                  : ((item.price - curPrice) / item.price) * 100;

                return (
                  <tr key={item.id} className="hover:bg-[#2b3139]/30 transition-colors">
                    <td className="py-4 text-[11px] text-[#848e9c]">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-4 font-bold">{item.symbol}</td>
                    <td className={`py-4 font-bold ${item.type === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {item.type}
                    </td>
                    <td className="py-4 text-right font-mono">{item.price.toLocaleString()}</td>
                    <td className="py-4 text-right font-mono">{item.amount.toFixed(4)}</td>
                    <td className="py-4 text-right font-mono">{(item.price * item.amount).toFixed(2)}</td>
                    <td className={`py-4 text-right font-mono font-bold ${pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {pnl >= 0 ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                      {pnl.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {history.length === 0 && <div className="text-center py-10 text-[#848e9c]">Chưa có dữ liệu giao dịch.</div>}
        </div>
      </div>
    </div>
  );
};