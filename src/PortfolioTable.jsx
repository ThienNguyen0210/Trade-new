// src/components/PortfolioTable.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PortfolioTable({ currentPrices, onClose }) {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/portfolio', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // --- LOGIC TÍNH TOÁN TỔNG LỰC ---
  const totals = portfolio.reduce((acc, item) => {
    const marketPrice = currentPrices[`${item.symbol}USDT`] || 0;
    
    // 1. Vốn thực tế đã chi cho lượng coin đang giữ (Lấy từ Backend hoặc tính tạm từ avgPrice)
    const invested = item.realCost || (item.balance * item.avgPrice); 
    
    // 2. Giá trị tài sản nếu bán ra ngay bây giờ
    const currentVal = item.balance * marketPrice;
    
    return {
      totalInvested: acc.totalInvested + invested,
      totalCurrentValue: acc.totalCurrentValue + currentVal
    };
  }, { totalInvested: 0, totalCurrentValue: 0 });

  const totalPnlUsdt = totals.totalCurrentValue - totals.totalInvested;
  const totalPnlPercent = totals.totalInvested > 0 ? (totalPnlUsdt / totals.totalInvested) * 100 : 0;
  const isTotalProfit = totalPnlUsdt >= 0;

  if (loading) return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-[#fcd535] animate-spin"><RefreshCw size={40} /></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-[#1e2329] border border-[#2b3139] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="p-6 border-b border-[#2b3139] flex justify-between items-center bg-[#161a1e]">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-[#fcd535] rounded-lg text-black"><Wallet size={20} /></div>
              TÀI SẢN CỦA TÔI
            </h2>
            <p className="text-[10px] text-[#848e9c] mt-1 uppercase tracking-widest font-bold">ThienNguyen Trading System v1.0</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchPortfolio} className="p-2 text-[#848e9c] hover:text-[#fcd535] transition-colors bg-[#2b3139] rounded-lg">
              <RefreshCw size={20} />
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-[#f6465d]/10 text-[#f6465d] hover:bg-[#f6465d] hover:text-white rounded-lg text-sm font-bold transition-all">
              Đóng
            </button>
          </div>
        </div>

        {/* TOP DASHBOARD - VỐN & LÃI TỔNG */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#161a1e]">
          <div className="bg-[#1e2329] p-5 rounded-2xl border border-[#2b3139] shadow-inner">
            <span className="text-xs text-[#848e9c] font-bold">TỔNG VỐN ĐÃ ĐẦU TƯ</span>
            <div className="text-2xl font-mono font-black text-white mt-2">
              ${totals.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#1e2329] p-5 rounded-2xl border border-[#2b3139]">
            <span className="text-xs text-[#848e9c] font-bold">GIÁ TRỊ HIỆN TẠI (NẾU BÁN)</span>
            <div className="text-2xl font-mono font-black text-[#fcd535] mt-2">
              ${totals.totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border-2 flex flex-col justify-center ${isTotalProfit ? 'bg-[#0ecb81]/5 border-[#0ecb81]/20' : 'bg-[#f6465d]/5 border-[#f6465d]/20'}`}>
            <span className="text-xs text-[#848e9c] font-bold">TỔNG LỜI / LỖ (%)</span>
            <div className={`text-2xl font-mono font-black mt-2 flex items-center gap-2 ${isTotalProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {isTotalProfit ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
              {isTotalProfit ? '+' : ''}{totalPnlPercent.toFixed(2)}%
            </div>
            <span className={`text-xs font-bold ${isTotalProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
               {isTotalProfit ? 'LÃI' : 'LỖ'}: {totalPnlUsdt.toLocaleString()} USDT
            </span>
          </div>
        </div>

        {/* BẢNG CHI TIẾT */}
        <div className="max-h-[45vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#1e2329] shadow-md z-10 text-[11px] text-[#848e9c] uppercase font-black">
              <tr>
                <th className="p-5">Cặp Giao Dịch</th>
                <th className="p-5">Giá Mua (DCA)</th>
                <th className="p-5">Giá Thị Trường</th>
                <th className="p-5">Vốn Đã Chi</th>
                <th className="p-5">Giá Trị Hiện Tại</th>
                <th className="p-5 text-right">Lời/Lỗ Tạm Tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3139]">
              {portfolio.map((item) => {
                const marketPrice = currentPrices[`${item.symbol}USDT`] || 0;
                const invested = item.realCost || (item.balance * item.avgPrice);
                const currentValue = item.balance * marketPrice;
                const pnlUsdt = currentValue - invested;
                const pnlPercent = invested > 0 ? (pnlUsdt / invested) * 100 : 0;
                const isProfit = pnlUsdt >= 0;

                return (
                  <tr key={item.symbol} className="hover:bg-[#2b3139]/40 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fcd535] to-[#f0b90b] flex items-center justify-center text-black font-black">
                          {item.symbol[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-black text-base">{item.symbol}</span>
                          <span className="text-[10px] text-[#848e9c] font-bold">SL: {item.balance.toFixed(6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm text-[#eaecef]">
                      ${item.avgPrice.toLocaleString()}
                    </td>
                    <td className={`p-5 font-mono text-sm font-bold ${marketPrice >= item.avgPrice ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      ${marketPrice.toLocaleString()}
                    </td>
                    <td className="p-5 font-mono text-sm text-[#848e9c]">
                      ${invested.toLocaleString()}
                    </td>
                    <td className="p-5 font-mono text-sm text-[#fcd535] font-bold">
                      ${currentValue.toLocaleString()}
                    </td>
                    <td className="p-5 text-right">
                      <div className={`flex flex-col items-end ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        <span className="font-black text-sm">{isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%</span>
                        <span className="text-[10px] opacity-70 font-bold">{isProfit ? '+' : ''}{pnlUsdt.toFixed(2)} USDT</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM NOTIFY */}
        <div className="p-4 bg-[#0b0e11] flex justify-between items-center text-[10px] font-bold">
          <div className="flex items-center gap-4 text-[#848e9c]">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div> BINANCE LIVE DATA</span>
            <span>TOKEN: {localStorage.getItem('token')?.substring(0, 10)}...</span>
          </div>
          <div className="text-[#fcd535]">
            © 2026 THIENNGUYEN EX. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  );
}