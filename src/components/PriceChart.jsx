import React, { useRef, useLayoutEffect } from 'react';
import { createChart, ColorType } from 'lightweight-charts'; // Không cần import CandlestickSeries riêng

function PriceChart({ onReady }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#161a1e' },
        textColor: '#848e9c',
        fontSize: 11,
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal
        vertLine: { labelBackgroundColor: '#2b3139' },
        horzLine: { labelBackgroundColor: '#2b3139' },
      },
      grid: {
        vertLines: { color: 'rgba(43, 49, 57, 0.3)' },
        horzLines: { color: 'rgba(43, 49, 57, 0.3)' },
      },
      rightPriceScale: {
        borderColor: '#2b3139',
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2b3139',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 15,
        minBarSpacing: 1,
      },
    });

    // Cú pháp đúng v5+: addCandlestickSeries trực tiếp
    seriesRef.current = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    chartRef.current = chart;

    // Pass series ra ngoài cho App dùng setData/update
    if (onReady) onReady(seriesRef.current);

    const resize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#161a1e]"
      style={{ minHeight: '500px' }}
    />
  );
}

export default PriceChart;