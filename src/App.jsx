import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, Wallet, History, Zap, LogOut, User, X, MessageCircle, Send,TrendingUp, TrendingDown } from 'lucide-react';
import { createChart, ColorType } from 'lightweight-charts';
import Auth from './Auth';
import OrderModal from './OrderModal'; // Đảm bảo bạn đã import component này
import toast, { Toaster } from 'react-hot-toast';
// --- Component Biểu đồ ---
const ChatRoom = ({ user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setMessages(await res.json());
    } catch (e) { console.error("Lỗi tải chat"); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

const handleSend = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      // GỬI KÈM USERNAME Ở ĐÂY
      body: JSON.stringify({ 
        message: input, 
        username: user 
      })
    });

    if (res.ok) {
      setInput('');
      fetchMessages();
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

  return (
    <div className="fixed right-4 bottom-20 w-80 h-[450px] bg-[#1e2329] border border-[#2b3139] rounded-xl shadow-2xl flex flex-col z-[200] animate-in slide-in-from-right">
      <div className="p-3 border-b border-[#2b3139] flex justify-between items-center bg-[#161a1e] rounded-t-xl">
        <span className="text-sm font-bold text-[#fcd535]">Chat</span>
        <X size={18} className="cursor-pointer hover:text-red-500" onClick={onClose} />
      </div>
<div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
  {messages.map((msg, i) => (
    <div key={i} className={`flex flex-col ${msg.username === user ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] text-[#848e9c] mb-1 font-bold">{msg.username}</span>
      <div 
        className={`px-3 py-2 rounded-lg text-sm max-w-[85%] shadow-sm ${
          msg.username === user 
            ? 'bg-[#fcd535] text-black rounded-tr-none' // Bo góc kiểu tin nhắn của mình
            : 'bg-[#2b3139] text-white rounded-tl-none' // Bo góc kiểu tin nhắn người khác
        }`}
        style={{ 
          wordBreak: 'break-word', // Tự động ngắt từ dài
          whiteSpace: 'pre-wrap'   // Giữ nguyên các dòng trống nhưng vẫn tự xuống dòng khi hết chiều rộng
        }}
      >
        {msg.message}
      </div>
    </div>
  ))}
  <div ref={scrollRef} />
</div>
      <form onSubmit={handleSend} className="p-3 border-t border-[#2b3139] flex gap-2">
<input 
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Viết gì đó..."
  /* Đổi text-xs thành text-base trên mobile */
  className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-md px-3 py-1.5 text-base md:text-xs text-white focus:outline-none focus:border-[#fcd535]"
/>
        <button type="submit" className="text-[#fcd535]"><Send size={18}/></button>
      </form>
    </div>
  );
};
const Portfolio = ({ onClose, holdings, prices, balance, portfolioData }) => {
  // --- PHẦN LOGIC TÍNH TOÁN ---

  // 1. TÍNH VỐN ĐÃ ĐẦU TƯ VÀO COIN (Chỉ tính tiền đã chi mua số coin hiện có)
  const totalCoinInvested = (portfolioData || []).reduce((sum, item) => {
    const symbol = item.symbol.toUpperCase();
    const currentQty = Number(holdings[symbol]) || 0;
    const avgPrice = Number(item.avgPrice) || 0;
    return sum + (currentQty * avgPrice);
  }, 0);

  // 2. TÍNH GIÁ TRỊ COIN HIỆN TẠI THEO THỊ TRƯỜNG
  const totalCoinMarketValue = Object.keys(holdings).reduce((sum, coin) => {
    const symbol = (coin + 'USDT').toUpperCase();
    const currentPrice = Number(prices[symbol]) || 0;
    const qty = Number(holdings[coin]) || 0;
    return sum + (qty * currentPrice);
  }, 0);

  // 3. TỔNG TÀI SẢN THỰC TẾ (Coin hiện tại + Tiền mặt dư)
  const currentTotalValue = totalCoinMarketValue + (Number(balance) || 0);

  // 4. LỜI LỖ BẰNG TIỀN (PNL)
  const totalPnlUsdt = totalCoinMarketValue - totalCoinInvested;

  // 5. TÍNH % ROI (QUAN TRỌNG: Chia cho vốn đầu tư để % nhảy đúng, không bị loãng bởi 167k USDT)
  const pnlPercent = totalCoinInvested > 0 ? (totalPnlUsdt / totalCoinInvested) * 100 : 0;
  const isProfit = totalPnlUsdt >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#2b3139] flex justify-between items-center bg-[#161a1e]">
          <h2 className="text-sm font-black text-[#fcd535] flex items-center gap-2 uppercase tracking-tight">
             <Wallet size={18} /> Ví của tôi
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#2b3139] rounded-full text-[#848e9c] transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-5">
          {/* Dashboard Tổng số dư */}
          <div className="text-center mb-6 p-5 bg-[#0b0e11] rounded-2xl border border-[#2b3139]">
            <span className="text-[10px] text-[#848e9c] block mb-1 font-bold uppercase tracking-widest">Tổng tài sản ước tính</span>
            <div className="text-2xl font-black text-white font-mono leading-none">
              {currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="text-xs text-[#fcd535] ml-1">USDT</span>
            </div>
            
            <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black ${isProfit ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
              {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {/* Hiển thị % (Dùng toFixed(2) nhưng đã chia cho vốn nên sẽ không còn bị 0.00%) */}
              {(isProfit ? '+' : '') + pnlPercent.toFixed(2)}% 
              <span className="ml-1">({isProfit ? '+' : ''}{totalPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#848e9c] uppercase tracking-wider ml-1">Chi tiết tài sản</h3>
            
            {/* USDT Card */}
            <div className="flex justify-between items-center p-3 bg-[#2b3139]/20 rounded-xl border border-[#2b3139]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[#0b0e11] font-black text-xs">U</div>
                <div>
                  <div className="font-black text-sm text-white">USDT</div>
                  <div className="text-[9px] text-[#848e9c] font-bold">TetherUS</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm text-white font-bold">{(Number(balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-[#848e9c]">Khả dụng</div>
              </div>
            </div>

            {/* Coins List */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar border-t border-[#2b3139]/30 pt-2">
              {Object.entries(holdings).map(([coin, qty]) => {
                const numericQty = Number(qty);
                if (numericQty <= 0.000001) return null;

                const symbol = (coin + 'USDT').toUpperCase();
                const currentPrice = Number(prices[symbol]) || 0;
                const currentValue = numericQty * currentPrice;

                const coinInfo = portfolioData?.find(p => p.symbol.toUpperCase() === coin.toUpperCase());
                const avgPrice = Number(coinInfo?.avgPrice) || 0;

                const coinPnlPercent = (avgPrice > 0 && currentPrice > 0) 
                  ? ((currentPrice - avgPrice) / avgPrice) * 100 
                  : 0;

                return (
                  <div key={coin} className="flex justify-between items-center p-3 bg-[#2b3139]/10 rounded-xl border border-[#2b3139]/30 hover:bg-[#2b3139]/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fcd535] flex items-center justify-center text-[#0b0e11] font-black text-[10px] uppercase">
                        {coin.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white uppercase">{coin}</div>
                        <div className="flex flex-col">
                          {/* HIỂN THỊ PHÉP NHÂN TRỰC QUAN NHƯ BẠN MUỐN */}
                          <span className="text-[9px] text-[#fcd535] font-mono font-bold italic">
                            {numericQty.toLocaleString()} × {currentPrice.toLocaleString()}
                          </span>
                          {currentPrice > 0 && (
                            <span className={`text-[9px] font-bold ${Math.abs(coinPnlPercent) < 0.01 ? 'text-gray-400' : (coinPnlPercent >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]')}`}>
                              {Math.abs(coinPnlPercent) < 0.01 ? '•' : (coinPnlPercent >= 0 ? '▲' : '▼')} {Math.abs(coinPnlPercent).toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm text-white font-bold">
                         ≈ {currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-[#848e9c]">USDT</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161a1e] border-t border-[#2b3139]">
          <button onClick={onClose} className="w-full py-3 bg-[#2b3139] hover:bg-[#fcd535] hover:text-black text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest active:scale-95">
            Đóng ví
          </button>
        </div>
      </div>
    </div>
  );
};
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
          <h2 className="text-lg font-bold text-[#fcd535] flex items-center gap-2"><History size={20} /> LỊCH SỬ GIAO DỊCH</h2>
          <button onClick={onClose} className="hover:text-red-500 transition-colors"><X /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-[11px]">
            <thead className="text-[#848e9c] border-b border-[#2b3139]">
              <tr>
                <th className="pb-3 text-left">Thời gian</th>
                <th className="pb-3">Cặp</th>
                <th className="pb-3">Loại</th>
                <th className="pb-3 text-right">Giá khớp</th>
                <th className="pb-3 text-right">Lời/Lỗ (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3139]">
              {history.map((item) => {
                // Lấy giá hiện tại từ "giỏ hàng" currentPrices
                const curPrice = currentPrices[item.symbol] || item.price;
                const pnl = item.type === 'BUY' 
                  ? ((curPrice - item.price) / item.price) * 100 
                  : ((item.price - curPrice) / item.price) * 100;

                return (
                  <tr key={item.id} className="hover:bg-[#2b3139]/30 transition-colors">
                    <td className="py-3 text-[#848e9c]">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="py-3 font-bold">{item.symbol}</td>
                    <td className={`py-3 font-bold ${item.type === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{item.type}</td>
                    <td className="py-3 text-right font-mono">{item.price.toLocaleString()}</td>
                    <td className={`py-3 text-right font-mono font-bold ${pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
function PriceChart({ onReady }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#161a1e' }, textColor: '#848e9c', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(43, 49, 57, 0.2)' }, horzLines: { color: 'rgba(43, 49, 57, 0.2)' } },
      rightPriceScale: { borderColor: '#2b3139', autoScale: true },
      timeScale: { borderColor: '#2b3139', timeVisible: true, barSpacing: 18 },
    });
    const series = chart.addCandlestickSeries({
      upColor: '#0ecb81', downColor: '#f6465d',
      borderVisible: false, wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
    });
    onReady(series);
    
    const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);
  return <div ref={containerRef} className="w-full h-full" />;
}

// --- Component Dòng lệnh (Order Book) ---
const OrderRow = ({ price, amount, type, maxTotal }) => {
  const total = price * amount;
  return (
    <div className="grid grid-cols-3 text-[11px] leading-5 relative hover:bg-[#2b3139] transition-colors cursor-pointer font-mono px-2">
      <div className={`absolute h-full opacity-10 right-0 ${type === 'ask' ? 'bg-red-500' : 'bg-green-500'}`}
           style={{ width: `${Math.min((total / (maxTotal || 10)) * 100, 100)}%` }} />
      <span className={type === 'ask' ? 'text-[#f6465d]' : 'text-[#0ecb81]'}>{price.toFixed(2)}</span>
      <span className="text-right text-[#eaecef]">{amount.toFixed(4)}</span>
      <span className="text-right text-[#848e9c]">{total.toFixed(2)}</span>
    </div>
  );
};

function App() {
  const [showPortfolio, setShowPortfolio] = useState(false); // Thêm dòng này vào cụm State
const [holdings, setHoldings] = useState({
  BTC: 0,
  ETH: 0,
  BNB: 0,
  SOL: 0
});
const fetchPortfolio = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return; // Nếu không có token thì đừng gọi để tránh lỗi 403

    const response = await fetch('http://localhost:5000/api/portfolio', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    // Quan trọng: Kiểm tra nếu data là mảng thì mới set, không thì set mảng rỗng
    setPortfolioData(Array.isArray(data) ? data : []); 
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
    setPortfolioData([]); // Lỗi thì cũng cho về mảng rỗng để app không sập
  }
};

// Tự động load dữ liệu khi App mở ra
useEffect(() => {
  fetchPortfolio();
}, []);
const [portfolioData, setPortfolioData] = useState([]);
const [showChat, setShowChat] = useState(false);
const [prices, setPrices] = useState({});
const [priceChange, setPriceChange] = useState(0); // Lưu % thay đổi
const [volume24h, setVolume24h] = useState(0);     // Lưu khối lượng 24h
  // 1. KHAI BÁO TẤT CẢ STATE TRƯỚC
  const [activeTab, setActiveTab] = useState("BTCUSDT");
  const [price, setPrice] = useState(0);
  const [lastPrice, setLastPrice] = useState(0);
  const [user, setUser] = useState(localStorage.getItem('username') || null);
  const [balance, setBalance] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSide, setOrderSide] = useState('BUY');

  const seriesRef = useRef(null);
  const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];

  // 2. CÁC HÀM XỬ LÝ LOGIC (Sau khi đã có State)
  const openTrade = (side) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setOrderSide(side);
    setIsOrderModalOpen(true);
  };
const handleResetBalance = async (amount) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:5000/api/reset-balance', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });

    if (res.ok) {
      toast.success(`Đã cập nhật số dư thành ${amount} USDT`);
      // Sau khi nạp xong, gọi lại hàm fetchBalance để con số trên màn hình nhảy luôn
      if (typeof fetchBalance === 'function') fetchBalance();
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || "Cập nhật thất bại!");
    }
  } catch (e) {
    console.error("Lỗi kết nối:", e);
    toast.error("Không thể kết nối đến máy chủ!");
  }
};
const handleOrderSuccess = async (newAssets) => {
    const token = localStorage.getItem('token');
    const coinSymbol = activeTab.replace('USDT', '');
    const loadingToast = toast.loading('Đang ghi sổ cái hệ thống...');

    const amountTraded = Math.abs(newAssets[coinSymbol] - (holdings[coinSymbol] || 0));

    try {
        const res = await fetch('http://localhost:5000/api/update-assets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                newUSDT: newAssets.USDT,
                coin: coinSymbol,
                newCoinQty: newAssets[coinSymbol],
                type: orderSide,      
                price: price,          
                amount: amountTraded   
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Giao dịch thất bại");

        // --- ĐOẠN QUAN TRỌNG CẦN SỬA ---
        setBalance(newAssets.USDT);
        setHoldings(prev => ({
            ...prev,
            [coinSymbol]: newAssets[coinSymbol]
        }));
        
        // Cập nhật lại giá vốn (avgPrice) và toàn bộ danh mục từ server
        await fetchPortfolio(); 
        // ------------------------------

        toast.success("Giao dịch thành công!", { id: loadingToast });
    } catch (err) {
        toast.error("Lỗi: " + err.message, { id: loadingToast });
    }
};

const fetchBalance = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    try {
        const res = await fetch('http://localhost:5000/api/balance', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
if (res.ok) {
    const data = await res.json();
    setBalance(data.USDT); // Thay vì data.balance
    setHoldings({
        BTC: data.BTC,
        ETH: data.ETH,
        BNB: data.BNB,
        SOL: data.SOL
    });
}
    } catch (err) { 
        console.error('Lỗi lấy balance:', err); 
    }
};

  // 3. CÁC EFFECT (Xử lý dữ liệu)
  useEffect(() => {
    if (user) fetchBalance();
    else setBalance(null);
  }, [user]);

 useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
        if (seriesRef.current) seriesRef.current.setData([]);
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${activeTab}&interval=1m&limit=500`);
            const data = await res.json();
            const formatted = data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]), high: parseFloat(d[2]),
                low: parseFloat(d[3]), close: parseFloat(d[4]),
            }));
            if (isMounted && seriesRef.current) seriesRef.current.setData(formatted);
        } catch (e) { console.error("Lỗi lịch sử:", e); }
    };

    fetchHistory();

    // KẾT NỐI ĐA LUỒNG: Vừa lấy nến, vừa lấy ticker (giá & volume 24h)
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${activeTab.toLowerCase()}@kline_1m/${activeTab.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);

        // Xử lý dữ liệu nến (kline)
        if (data.e === "kline") {
            const { k } = data;
            const newPrice = parseFloat(k.c);
            setPrice(prev => { setLastPrice(prev); return newPrice; });
            setPrices(prev => ({ ...prev, [data.s]: newPrice }));
            if (seriesRef.current) {
                seriesRef.current.update({
                    time: k.t / 1000,
                    open: parseFloat(k.o), high: parseFloat(k.h),
                    low: parseFloat(k.l), close: newPrice,
                });
            }
        }

        // Xử lý dữ liệu thị trường 24h (ticker)
        if (data.e === "24hrTicker") {
            setPriceChange(parseFloat(data.P)); // P là % thay đổi 24h
            setVolume24h(parseFloat(data.q));   // q là tổng volume USDT
        }
    };

    return () => { isMounted = false; ws.close(); };
}, [activeTab]);

return (
<div className="flex flex-col  md:flex-row h-screen w-screen max-w-full bg-[#0b0e11] text-[#eaecef] font-sans overflow-x-hidden">
   <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e2329',
          color: '#eaecef',
          border: '1px solid #2b3139',
          fontSize: '14px',
          borderRadius: '12px',
        },
      }}
    />

    {/* Auth Modal */}
    {showAuth && (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative">
          <button 
            onClick={() => setShowAuth(false)} 
            className="absolute -top-2 -right-2 p-1 bg-[#2b3139] rounded-full text-white z-[60] hover:bg-red-500 transition-colors"
          >
            <X size={20} />
          </button>
          <Auth onLoginSuccess={(name, bal) => {
              setUser(name);
              setBalance(typeof bal === 'number' ? bal : 0); 
              setShowAuth(false);
          }} />
        </div>
      </div>
    )}

    {/* Sidebar & Bottom Nav - Responsive linh hoạt */}
<aside className="fixed bottom-0 left-0 right-0 h-16 bg-[#161a1e] border-t border-[#2b3139] flex flex-row items-center justify-center z-[90] md:relative md:w-14 md:h-screen md:flex-col md:border-r md:py-6 md:shrink-0">
<nav className="flex flex-row md:flex-col w-full max-w-md md:max-w-none justify-around items-center h-full">
      <div className="text-[#fcd535] hidden md:block md:mb-10 animate-pulse">
        <Zap size={24} fill="currentColor" />
      </div>

      <nav className="flex flex-row md:flex-col gap-2 md:gap-8 w-full justify-around md:justify-start">
        <div className="text-[#fcd535] cursor-pointer p-2 hover:scale-110 transition-transform" title="Giao dịch">
          <BarChart2 size={22} />
        </div>
        <div 
          onClick={() => { if (!user) return setShowAuth(true); setShowPortfolio(true); }} 
          className={`cursor-pointer p-2 transition-all hover:scale-110 ${showPortfolio ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-white'}`}
          title="Ví tài sản"
        >
          <Wallet size={22} />
        </div>
        <div 
          onClick={() => { if (!user) return setShowAuth(true); setShowHistory(true); }} 
          className={`cursor-pointer p-2 transition-all hover:scale-110 ${showHistory ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-white'}`}
          title="Lịch sử"
        >
          <History size={22} />
        </div>
        <div 
          onClick={() => { if (!user) return setShowAuth(true); setShowChat(!showChat); }} 
          className={`cursor-pointer p-2 transition-all hover:scale-110 ${showChat ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-white'}`}
          title="Chat"
        >
          <MessageCircle size={22} />
        </div>
      </nav>
      <div className="mt-auto text-[#2b3139] hidden md:block">
        <div className="w-6 h-[1px] bg-current mb-4"></div>
      </div>
      </nav>
    </aside>

    {/* Main Container */}
    <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
      {/* Header */}
      <header className="h-14 bg-[#161a1e] border-b border-[#2b3139] flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-black tracking-tighter text-[#fcd535]">THIENNGUYEN <span className="text-white hidden sm:inline">EX</span></span>
          <div className="ml-2 h-4 w-[1px] bg-[#2b3139] hidden sm:block"></div>
          <span className="text-[10px] text-[#848e9c] font-medium uppercase tracking-widest hidden lg:block">Trading Platform</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="flex items-center gap-2 md:gap-4 bg-[#1e2329] px-2 md:px-4 py-1.5 rounded-lg border border-[#2b3139]">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] md:text-xs font-bold text-white truncate max-w-[60px] md:max-w-none">{user}</span>
                  <User size={10} className="text-[#fcd535]" />
                </div>
                <span className="text-[9px] md:text-[11px] text-[#0ecb81] font-mono font-bold">
                  {balance !== null ? `${balance.toLocaleString('vi-VN')} U` : '0.00 U'}
                </span>
              </div>
<button 
  onClick={() => { 
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null); // Set về null để React ẩn các phần cần quyền login ngay lập tức
    setBalance(0);
    setHoldings({});
    window.location.href = '/'; // Chuyển hướng về trang chủ để làm mới sạch sẽ
  }} 
  className="p-2 hover:bg-[#2b3139] rounded-md text-[#848e9c] hover:text-red-500 transition-all"
>
  <LogOut size={16} />
</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-[#fcd535] text-black text-[10px] md:text-xs py-2 px-3 md:px-6 rounded-md font-bold shadow-[0_0_15px_rgba(252,213,53,0.2)]">
              ĐĂNG NHẬP
            </button>
          )}
        </div>
      </header>

      {/* Tabs Symbols */}
      <div className="h-12 bg-[#161a1e] border-b border-[#2b3139] flex items-center px-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
        {SYMBOLS.map(sym => {
          const coin = sym.replace('USDT', '');
          const coinQty = holdings[coin] || 0;
          const isActive = activeTab === sym;
          return (
            <button key={sym} onClick={() => setActiveTab(sym)} className={`px-3 h-8 rounded flex flex-col justify-center items-start transition-all min-w-[90px] ${isActive ? 'bg-[#2b3139] border border-[#fcd535]/30' : 'hover:bg-[#2b3139]/50'}`}>
              <span className={`text-[10px] font-bold ${isActive ? 'text-[#fcd535]' : 'text-[#eaecef]'}`}>{sym}</span>
              {user && <span className={`text-[8px] font-mono ${coinQty > 0 ? 'text-[#0ecb81]' : 'text-[#848e9c]'}`}>{coinQty.toFixed(2)} {coin}</span>}
            </button>
          );
        })}
      </div>

      {/* Layout Content */}
<main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-black p-1 gap-1">        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Chart Section - Đã sửa flex-1 để tự giãn và min-h lớn hơn trên PC */}
          <section className="flex-1 min-h-[450px] md:min-h-[500px] bg-[#161a1e] rounded-sm flex flex-col border border-[#2b3139] overflow-hidden">
            <div className="p-3 bg-[#1e2329]/20 flex justify-between items-center border-b border-[#2b3139]/50">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#848e9c] font-bold uppercase">{activeTab}</span>
                <div className={`text-xl font-black font-mono ${price >= lastPrice ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex gap-3 text-right">
                <div className="flex flex-col">
                  <span className="text-[8px] text-[#848e9c]">24h Change</span>
                  <span className={`text-[10px] font-bold ${priceChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-[#848e9c]">24h Volume</span>
                  <span className="text-[10px] text-white font-bold">
                    {volume24h > 1000000 ? (volume24h / 1000000).toFixed(2) + 'M' : volume24h.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            {/* Div bao quanh Chart phải có flex-1 để lấy hết chiều cao còn lại */}
            <div className="flex-1 relative w-full h-full">
              <PriceChart onReady={(s) => { seriesRef.current = s; }} />
            </div>
          </section>

          {/* Quick Trade Section - shrink-0 để không đè nén Chart */}
          <section className="bg-[#161a1e] border border-[#2b3139] p-4 flex flex-col sm:flex-row justify-between items-center rounded-sm gap-4 shrink-0">
            <div className="flex w-full sm:w-auto justify-between sm:gap-8">
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-black text-[#848e9c] mb-1 uppercase">Tài sản khả dụng</span>
                <div className="flex items-center gap-2">
                  <div className="text-[12px] md:text-[14px] text-white font-black font-mono">
                    {balance?.toLocaleString()} <span className="text-[#fcd535] text-[10px]">USDT</span>
                  </div>
                  <button 
                    onClick={() => {
                      const val = prompt("Nhập số dư USDT muốn thay đổi:", balance?.toFixed(2));
                      if (val !== null && !isNaN(val) && val !== "") handleResetBalance(val);
                    }}
                    className="p-1 bg-[#2b3139] hover:bg-[#fcd535] hover:text-black text-[#fcd535] rounded transition-all"
                  >
                    <Zap size={12} fill="currentColor" />
                  </button>
                </div>
                <span className="text-[8px] font-bold text-[#474d57] mt-1 italic uppercase">By ThienNguyen Dev</span>
              </div>

              <div className="flex flex-col justify-center border-l border-[#2b3139] pl-4 md:pl-6">
                {(() => {
                  const currentCoin = activeTab.replace('USDT', '');
                  const coinData = portfolioData?.find(p => p.symbol.toUpperCase() === currentCoin);
                  const qty = Number(holdings[currentCoin]) || 0;
                  const avgPrice = Number(coinData?.avgPrice) || 0;
                  const curPrice = price || 0;
                  const totalCost = qty * avgPrice;
                  const pnl = (qty * curPrice) - totalCost;
                  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  const isProfit = pnl >= 0;
                  return (
                    <>
                      <div className="text-[9px] font-bold text-[#848e9c] uppercase">Vốn {currentCoin}</div>
                      <div className="text-[10px] md:text-[11px] font-mono text-white">{totalCost.toFixed(2)} <span className="text-[8px] text-[#848e9c]">USDT</span></div>
                      <div className={`text-[10px] font-black flex items-center gap-1 ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {isProfit ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        {isProfit ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => openTrade('BUY')} className="flex-1 sm:px-10 py-3 bg-[#0ecb81] text-[#0b0e11] rounded font-black text-xs active:scale-95 transition-transform shadow-[0_4px_10px_rgba(14,203,129,0.2)]">MUA</button>
              <button onClick={() => openTrade('SELL')} className="flex-1 sm:px-10 py-3 bg-[#f6465d] text-white rounded font-black text-xs active:scale-95 transition-transform shadow-[0_4px_10px_rgba(246,70,93,0.2)]">BÁN</button>
            </div>
          </section>
        </div>

        {/* Order Book - Giữ nguyên độ rộng cố định */}
        <div className="hidden lg:flex w-[300px] bg-[#161a1e] border border-[#2b3139] flex-col py-2 rounded-sm shrink-0">
          <div className="px-4 py-1 border-b border-[#2b3139] flex justify-between text-[9px] text-[#848e9c] font-bold uppercase">
             <span>Giá (USDT)</span>
             <span>Số lượng</span>
          </div>
          <div className="flex-1 overflow-hidden font-mono">
            {[...Array(12)].map((_, i) => (
              <OrderRow key={`ask-${i}`} price={price + (12 - i) * 1.5} amount={Math.random()} type="ask" maxTotal={50} />
            ))}
            <div className={`py-3 text-center text-lg font-black border-y border-[#2b3139] my-1 bg-[#1e2329]/30 ${price >= lastPrice ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {price.toFixed(2)}
            </div>
            {[...Array(12)].map((_, i) => (
              <OrderRow key={`bid-${i}`} price={price - (i + 1) * 1.5} amount={Math.random()} type="bid" maxTotal={50} />
            ))}
          </div>
        </div>
      </main>
    </div>

    {/* Modals & Chat */}
<OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        side={orderSide}
        symbol={activeTab}
        currentPrice={price}
        usdtBalance={balance || 0}
        coinBalance={holdings[activeTab.replace('USDT', '')]}
        onOrderPlaced={handleOrderSuccess}
      />
      {showPortfolio && (
        <Portfolio 
          onClose={() => setShowPortfolio(false)} 
          holdings={holdings} 
          prices={prices} 
          balance={balance}
          portfolioData={portfolioData} 
        />
      )}
      {showHistory && (
        <TradeHistory 
          onClose={() => setShowHistory(false)} 
          currentPrices={prices} 
        />
      )}
      {showChat && user && <ChatRoom user={user} onClose={() => setShowChat(false)} />}
    </div>
  );
}
export default App;